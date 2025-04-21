// supabase-client.js
// This file initializes and exports the Supabase client

// Import from an ES Module CDN instead of bare specifier for browser compatibility
import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://urhehutiqaazkfccaenf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaGVodXRpcWFhemtmY2NhZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDg3MzksImV4cCI6MjA2MDc4NDczOX0.TxmtQDJ-dtGREZNZiLh8RmjlmOurMpKucooEukuDSzI';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
