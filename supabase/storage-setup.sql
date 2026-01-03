-- ============================================================================
-- SUPABASE STORAGE SETUP SCRIPT
-- ============================================================================
-- Run these SQL commands in your Supabase SQL Editor to set up storage
-- ============================================================================

-- Step 1: Create the storage bucket (Run in Supabase Dashboard UI, not SQL)
-- Go to Storage → New Bucket
-- Name: images
-- Public: YES ✅
-- Then run the policies below

-- Step 2: Set up storage policies for the 'images' bucket

-- Policy 1: Allow public read access to all images
CREATE POLICY "Public Access - Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload - Logged in users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy 3: Allow users to update/delete their own uploads
CREATE POLICY "Owner Management - Users can manage their uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = 'rewards');

CREATE POLICY "Owner Delete - Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = 'rewards');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%'
ORDER BY policyname;

-- Expected output: 4 policies related to 'images'
-- 1. Public Access
-- 2. Authenticated Upload
-- 3. Owner Management
-- 4. Owner Delete

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If policies aren't working, you might need to check RLS is enabled:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- To delete and recreate policies (if needed):
-- DROP POLICY IF EXISTS "Public Access - Anyone can view images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload - Logged in users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Owner Management - Users can manage their uploads" ON storage.objects;
-- DROP POLICY IF EXISTS "Owner Delete - Users can delete their uploads" ON storage.objects;

-- ============================================================================
-- AFTER SETUP
-- ============================================================================

-- Test the setup:
-- 1. Go to your app: /admin/rewards
-- 2. Create or edit a reward
-- 3. Upload an image
-- 4. Check browser console for any errors
-- 5. If you see "Storage not configured" warning, the bucket may not exist
-- 6. If you see 403 errors, the policies may not be set correctly

-- Check uploaded files:
-- Go to Supabase Dashboard → Storage → images → rewards folder
-- You should see your uploaded image files

-- ============================================================================
