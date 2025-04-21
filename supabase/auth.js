// auth.js
// This file contains authentication-related functions

import supabase from './supabase-client.js';

/**
 * Sign up a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Object} metadata - Additional user metadata (e.g., isAdmin)
 * @returns {Promise} - Supabase signup response
 */
export async function signUp(email, password, metadata = {}) {
  // First, sign up the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) return { data, error };

  // If signup was successful and we have a user, update their profile
  // Note: This might not be necessary if you have the trigger function set up in your database
  // to automatically create profiles, but we'll do it anyway to be safe
  if (data.user) {
    try {
      // Check if a profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create a new profile with the is_admin flag
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            is_admin: metadata.isAdmin === true,
            updated_at: new Date().toISOString()
          });
      } else {
        // Update the existing profile with the is_admin flag
        await supabase
          .from('profiles')
          .update({
            is_admin: metadata.isAdmin === true,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);
      }
    } catch (profileError) {
      console.error('Error updating profile:', profileError);
      // We don't return an error here because the signup was successful
      // The profile update is a secondary operation
    }
  }

  return { data, error };
}

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Supabase signin response
 */
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

/**
 * Sign out the current user
 * @returns {Promise} - Supabase signout response
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Get the current user session
 * @returns {Promise} - Supabase session response
 */
export async function getSession() {
  return supabase.auth.getSession();
}

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} - True if user is admin, false otherwise
 */
export async function isUserAdmin() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  // Check if the user is joshua.cancel@kaseya.com (hardcoded admin)
  if (userData.user.email === 'joshua.cancel@kaseya.com') {
    return true;
  }

  // As a fallback, also check the profiles table
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single();

  if (error || !profileData) return false;

  return profileData.is_admin === true;
}

/**
 * Set up auth state change listener
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
