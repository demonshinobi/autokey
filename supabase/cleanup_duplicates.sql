-- This script cleans up duplicate entries in the user_access table
-- It keeps only the most recent entry for each email address

-- First, create a temporary table to store the IDs of entries to keep
CREATE TEMP TABLE entries_to_keep AS
WITH ranked_entries AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) as rn
  FROM 
    user_access
)
SELECT id FROM ranked_entries WHERE rn = 1;

-- Delete all entries that are not in the entries_to_keep table
DELETE FROM user_access
WHERE id NOT IN (SELECT id FROM entries_to_keep);

-- Drop the temporary table
DROP TABLE entries_to_keep;

-- Verify the results
SELECT email, COUNT(*) FROM user_access GROUP BY email HAVING COUNT(*) > 1;
