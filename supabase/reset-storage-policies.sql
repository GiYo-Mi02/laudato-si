-- RESET and FIX Storage Policies
-- This will remove ALL existing policies and create fresh ones

-- 1. Drop ALL storage.objects policies (complete reset)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END
$$;

-- 2. Make sure images bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[])
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[];

-- 3. Create simple, permissive policies
CREATE POLICY "Anyone can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- 4. Verify results - show bucket info
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'images';

-- 5. Show storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
