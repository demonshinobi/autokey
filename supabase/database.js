// database.js
// This file contains database-related functions

import supabase from './supabase-client.js';

/**
 * Upload CSV data to Supabase
 * @param {Object} csvData - Parsed CSV data object
 * @returns {Promise} - Supabase insert response
 */
export async function uploadCSVData(csvData) {
  // First, store the file metadata
  const { data: fileData, error: fileError } = await supabase
    .from('csv_files')
    .insert({
      name: csvData.name,
      upload_date: csvData.uploadDate,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (fileError) throw fileError;

  // Then, store each company record with a reference to the file
  const companyRecords = csvData.companyData.map(company => ({
    file_id: fileData.id,
    account_name: company['Account Name'],
    username: company.username,
    account_uid: company.AccountUid,
    instance: company.instance
  }));

  const { data: companyData, error: companyError } = await supabase
    .from('company_credentials')
    .insert(companyRecords);

  if (companyError) throw companyError;

  return { fileData, companyData };
}

/**
 * Get all company credentials
 * @returns {Promise} - Supabase select response
 */
export async function getAllCompanyCredentials() {
  const { data, error } = await supabase
    .from('company_credentials')
    .select(`
      id,
      account_name,
      username,
      account_uid,
      instance,
      csv_files (
        name,
        upload_date
      )
    `)
    .order('account_name', { ascending: true });

  if (error) throw error;

  return data; // Return the raw data array directly
}

/**
 * Get the most recent CSV file info
 * @returns {Promise} - Supabase select response
 */
export async function getMostRecentCSVFile() {
  const { data, error } = await supabase
    .from('csv_files')
    .select('*')
    .order('upload_date', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all active users (admin only)
 * @returns {Promise} - Supabase select response
 */
export async function getAllUsers() {
  try {
    // Get profiles data
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue with fallback methods
    }

    // Get approved users from user_access
    const { data: accessData, error: accessError } = await supabase
      .from('user_access')
      .select('*')
      .eq('approved', true);

    if (accessError) {
      console.error('Error fetching user_access:', accessError);
      // Continue with fallback methods
    }

    // Combine and deduplicate the data
    let combinedUsers = [];

    // Add profile data if available
    if (profilesData && profilesData.length > 0) {
      // Get user emails from auth.users via RPC function if available
      // This is a workaround since we can't access auth.users directly from client
      const { data: userEmails, error: emailsError } = await supabase
        .rpc('get_user_emails_by_ids', {
          user_ids: profilesData.map(p => p.id)
        });

      const emailMap = {};
      if (!emailsError && userEmails) {
        userEmails.forEach(item => {
          emailMap[item.id] = item.email;
        });
      }

      profilesData.forEach(profile => {
        combinedUsers.push({
          id: profile.id,
          email: emailMap[profile.id] || 'Unknown',
          is_admin: profile.is_admin,
          created_at: profile.updated_at
        });
      });
    }

    // Add user_access data if available
    if (accessData && accessData.length > 0) {
      // Update existing users with user_access data or add new ones
      accessData.forEach(access => {
        if (!access.email) return; // Skip entries without email

        const existingUserIndex = combinedUsers.findIndex(u =>
          (access.user_id && u.id === access.user_id) || u.email === access.email
        );

        if (existingUserIndex >= 0) {
          // Update existing user
          combinedUsers[existingUserIndex].approved = access.approved;
        } else {
          // Add new user
          combinedUsers.push({
            id: access.user_id || access.id,
            email: access.email,
            is_admin: false, // Default value
            approved: access.approved,
            created_at: access.created_at
          });
        }
      });
    }

    // Filter out users that exist in user_access with approved=false
    // This ensures we don't show users in both active and pending lists
    const pendingEmails = new Set();

    // Get pending users to exclude them from active users
    const { data: pendingData } = await supabase
      .from('user_access')
      .select('email')
      .eq('approved', false);

    if (pendingData && pendingData.length > 0) {
      pendingData.forEach(user => {
        if (user.email) pendingEmails.add(user.email);
      });
    }

    // Filter out pending users from active users
    const activeUsers = combinedUsers.filter(user => !pendingEmails.has(user.email));

    return activeUsers;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Get pending users (admin only)
 * @returns {Promise} - Supabase select response with deduplicated users
 */
export async function getPendingUsers() {
  try {
    // Try to get pending users from the user_access table
    const { data, error } = await supabase
      .from('user_access')
      .select('*')
      .eq('approved', false);

    if (error) throw error;

    // Deduplicate users by email to avoid showing the same user multiple times
    const uniqueUsers = [];
    const emailSet = new Set();

    if (data && data.length > 0) {
      // Sort by updated_at in descending order to get the most recent entry first
      const sortedData = [...data].sort((a, b) =>
        new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      );

      sortedData.forEach(user => {
        if (!emailSet.has(user.email)) {
          emailSet.add(user.email);
          uniqueUsers.push(user);
        }
      });
    }

    return uniqueUsers;
  } catch (error) {
    console.error('Error getting pending users:', error);
    throw error;
  }
}

/**
 * Approve a pending user (admin only)
 * @param {string} email - Email of the user to approve
 * @returns {Promise} - Supabase update response
 */
export async function approveUser(email) {
  try {
    // First, get all entries for this email
    const { data: entries, error: fetchError } = await supabase
      .from('user_access')
      .select('*')
      .eq('email', email);

    if (fetchError) throw fetchError;

    if (!entries || entries.length === 0) {
      throw new Error(`No user found with email ${email}`);
    }

    // Keep only the most recent entry and delete the rest
    entries.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const mostRecentEntry = entries[0];

    // Delete duplicate entries
    if (entries.length > 1) {
      const idsToDelete = entries.slice(1).map(entry => entry.id);
      const { error: deleteError } = await supabase
        .from('user_access')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.warn('Error deleting duplicate entries:', deleteError);
        // Continue anyway to approve the most recent entry
      }
    }

    // Approve the most recent entry
    const { data, error } = await supabase
      .from('user_access')
      .update({ approved: true, updated_at: new Date().toISOString() })
      .eq('id', mostRecentEntry.id);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
}

/**
 * Deny/delete a pending user (admin only)
 * @param {string} email - Email of the user to deny
 * @returns {Promise} - Supabase delete response
 */
export async function denyUser(email) {
  try {
    // Delete all entries for this email
    const { data, error } = await supabase
      .from('user_access')
      .delete()
      .eq('email', email);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error denying user:', error);
    throw error;
  }
}

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {boolean} isAdmin - Whether the user should be an admin
 * @returns {Promise} - Supabase update response
 */
export async function updateUserRole(userId, isAdmin) {
  try {
    // First try to update the profiles table (preferred method)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);

    if (!profileError) {
      return profileData;
    }

    // Fallback to user_access table if profiles update fails
    const { data: accessData, error: accessError } = await supabase
      .from('user_access')
      .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (accessError) throw accessError;
    return accessData;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}
