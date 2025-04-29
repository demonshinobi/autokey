-- Create a function to get user emails by IDs
-- This allows the client to get emails from auth.users without direct access to the table
CREATE OR REPLACE FUNCTION get_user_emails_by_ids(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;
