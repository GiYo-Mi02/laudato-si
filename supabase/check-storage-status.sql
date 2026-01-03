-- Check current storage setup
-- Run this to see what's configured

-- 1. Check if images bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'images';

-- 2. Check all storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 3. Check rewards table policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rewards'
ORDER BY policyname;
