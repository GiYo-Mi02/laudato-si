-- Fix Image URL Access Issues
-- Run this in Supabase SQL Editor

-- 1. Ensure the images bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- 2. Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access to Reward Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload reward images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read reward images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload reward images" ON storage.objects;

-- 3. Allow PUBLIC access to read ALL images (simplest approach)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 4. Allow authenticated users to upload images
CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 5. Allow authenticated users to update/delete their images
CREATE POLICY "Authenticated update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- 6. Verify rewards table RLS allows reading image_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rewards' 
    AND policyname = 'Anyone can view active rewards'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (is_active = true)';
  END IF;
END
$$;

-- 7. Show all current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' OR tablename = 'rewards'
ORDER BY schemaname, tablename, policyname;
