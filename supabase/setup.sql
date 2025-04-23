-- Create user_access table to manage user access permissions
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Enable RLS on user_access table
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
