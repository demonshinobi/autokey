-- Create profiles table for user roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create csv_files table to track uploaded files
CREATE TABLE IF NOT EXISTS csv_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create company_credentials table for storing company data
CREATE TABLE IF NOT EXISTS company_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES csv_files(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  username TEXT,
  account_uid TEXT,
  instance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_access table to manage user access permissions
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Create RLS policies for csv_files table
CREATE POLICY "Admins can insert into csv_files" ON csv_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Anyone can view csv_files" ON csv_files
  FOR SELECT USING (TRUE);

-- Create RLS policies for company_credentials table
CREATE POLICY "Anyone can view company_credentials" ON company_credentials
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert into company_credentials" ON company_credentials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Create RLS policies for user_access table
-- Allow anyone to insert (for new signups)
CREATE POLICY "Anyone can insert their own user_access" ON user_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can select all records
CREATE POLICY "Admins can view all user_access" ON user_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Users can view their own records
CREATE POLICY "Users can view their own user_access" ON user_access
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can update any record
CREATE POLICY "Admins can update any user_access" ON user_access
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Only admins can delete any record
CREATE POLICY "Admins can delete any user_access" ON user_access
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Create function to automatically set admin status for joshua.cancel@kaseya.com
CREATE OR REPLACE FUNCTION public.set_admin_for_joshua()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'joshua.cancel@kaseya.com' THEN
    INSERT INTO profiles (id, is_admin)
    VALUES (NEW.id, TRUE)
    ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

    INSERT INTO user_access (user_id, email, approved)
    VALUES (NEW.id, NEW.email, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET approved = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function on new user creation
DROP TRIGGER IF EXISTS set_admin_for_joshua_trigger ON auth.users;
CREATE TRIGGER set_admin_for_joshua_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_for_joshua();

-- Insert test data for existing users
INSERT INTO profiles (id, is_admin)
SELECT id, email = 'joshua.cancel@kaseya.com' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Approve existing users
INSERT INTO user_access (user_id, email, approved)
SELECT id, email, email = 'joshua.cancel@kaseya.com' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Directly set joshua.cancel@kaseya.com as admin and approved
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (SELECT id FROM auth.users WHERE email = 'joshua.cancel@kaseya.com');

UPDATE user_access
SET approved = TRUE
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'joshua.cancel@kaseya.com');

-- Fix duplicate entries for leonardo.mico@kaseya.com
-- First, delete all existing entries for leonardo.mico@kaseya.com
DELETE FROM user_access
WHERE email = 'leonardo.mico@kaseya.com';

-- Then create a new approved entry for leonardo.mico@kaseya.com
INSERT INTO user_access (user_id, email, approved, created_at, updated_at)
SELECT id, 'leonardo.mico@kaseya.com', TRUE, NOW(), NOW()
FROM auth.users
WHERE email = 'leonardo.mico@kaseya.com';

-- Also ensure leonardo.mico@kaseya.com has a profile
INSERT INTO profiles (id, is_admin, created_at, updated_at)
SELECT id, FALSE, NOW(), NOW()
FROM auth.users
WHERE email = 'leonardo.mico@kaseya.com'
ON CONFLICT (id) DO NOTHING;

-- Also approve josheluno87@gmail.com if it exists
UPDATE user_access
SET approved = TRUE
WHERE email = 'josheluno87@gmail.com';
