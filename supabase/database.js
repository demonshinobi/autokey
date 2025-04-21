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

  // Transform the data to match the expected format in the app
  return data.map(record => ({
    'Account Name': record.account_name,
    username: record.username,
    AccountUid: record.account_uid,
    instance: record.instance,
    _fileInfo: {
      name: record.csv_files.name,
      uploadDate: record.csv_files.upload_date
    }
  }));
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
 * Get all users (admin only)
 * @returns {Promise} - Supabase select response
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) throw error;
  return data;
}

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {boolean} isAdmin - Whether the user should be an admin
 * @returns {Promise} - Supabase update response
 */
export async function updateUserRole(userId, isAdmin) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
  return data;
}
