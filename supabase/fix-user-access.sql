-- This script fixes issues with the user_access table and ensures proper permissions

-- 1. Make sure the user_access table exists
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add a policy to allow anyone to select from user_access
-- This is important for the user management UI to work
DROP POLICY IF EXISTS "Anyone can select from user_access" ON user_access;
CREATE POLICY "Anyone can select from user_access" ON user_access
  FOR SELECT USING (TRUE);

-- 3. Add a policy to allow anyone to update user_access
-- This is needed for the approval process to work
DROP POLICY IF EXISTS "Anyone can update user_access" ON user_access;
CREATE POLICY "Anyone can update user_access" ON user_access
  FOR UPDATE USING (TRUE);

-- 4. Add a policy to allow anyone to delete from user_access
-- This is needed for the deny process to work
DROP POLICY IF EXISTS "Anyone can delete from user_access" ON user_access;
CREATE POLICY "Anyone can delete from user_access" ON user_access
  FOR DELETE USING (TRUE);

-- 5. Enable RLS on the user_access table
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- 6. Fix Leonardo's record
-- First, delete any existing records for leonardo.mico@kaseya.com
DELETE FROM user_access
WHERE email = 'leonardo.mico@kaseya.com';

-- Then create a new record for leonardo.mico@kaseya.com
INSERT INTO user_access (email, approved, created_at, updated_at)
VALUES ('leonardo.mico@kaseya.com', TRUE, NOW(), NOW());

-- 7. Make sure joshua.cancel@kaseya.com is approved
-- First, delete any existing records for joshua.cancel@kaseya.com
DELETE FROM user_access
WHERE email = 'joshua.cancel@kaseya.com';

-- Then create a new record for joshua.cancel@kaseya.com
INSERT INTO user_access (email, approved, created_at, updated_at)
VALUES ('joshua.cancel@kaseya.com', TRUE, NOW(), NOW());

-- 8. Add a test user
INSERT INTO user_access (email, approved, created_at, updated_at)
VALUES ('test.user@example.com', TRUE, NOW(), NOW());
