-- Check if image_url column exists in rewards table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If image_url is missing, add it:
-- ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url TEXT;
