-- Drop existing RLS policies on user_access table
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON "public"."user_access";

-- Create a simpler RLS policy that won't cause recursion
CREATE POLICY "Allow full access to authenticated users"
ON "public"."user_access"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Make sure the table has the right structure
ALTER TABLE IF EXISTS "public"."user_access" 
ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "approved" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;

-- Enable RLS on the table
ALTER TABLE "public"."user_access" ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "user_access_email_idx" ON "public"."user_access" ("email");
CREATE INDEX IF NOT EXISTS "user_access_user_id_idx" ON "public"."user_access" ("user_id");

-- Insert default admin user if not exists
INSERT INTO "public"."user_access" (email, approved, is_admin, created_at, updated_at)
VALUES ('joshua.cancel@kaseya.com', true, true, NOW(), NOW())
ON CONFLICT (email) 
DO UPDATE SET is_admin = true, approved = true, updated_at = NOW();
