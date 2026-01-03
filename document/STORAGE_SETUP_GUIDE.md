# Supabase Storage Setup Guide

## Issue

When admins upload images for rewards, the images aren't showing because the Supabase Storage bucket doesn't exist yet.

## Quick Fix - Create Storage Bucket

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **Laudato Si Web App**
3. Click on **Storage** in the left sidebar

### Step 2: Create the "images" Bucket

1. Click the **"New bucket"** button
2. Configure the bucket:

```
Name: images
Public bucket: ✅ CHECKED (Very Important!)
File size limit: 5 MB
Allowed MIME types: image/*
```

3. Click **"Create bucket"**

### Step 3: Set Up Storage Policies (IMPORTANT!)

After creating the bucket, you need to set permissions:

1. Click on the **"images"** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Public Read Access

```sql
-- Allow anyone to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

Or use the UI:
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition: `bucket_id = 'images'`

#### Policy 2: Authenticated Upload

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

Or use the UI:
- Policy name: `Authenticated Upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition: `bucket_id = 'images'`

#### Policy 3: Owner Update/Delete

```sql
-- Allow users to update/delete their own uploads
CREATE POLICY "Owner Update Delete"
ON storage.objects FOR UPDATE, DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner::text);
```

Or use the UI:
- Policy name: `Owner Update Delete`
- Allowed operation: `UPDATE, DELETE`
- Target roles: `authenticated`
- Policy definition: `bucket_id = 'images' AND auth.uid()::text = owner::text`

### Step 4: Test the Upload

1. Go to admin panel: `/admin/rewards`
2. Click "Add Reward" or edit existing reward
3. Upload an image
4. Click "Save"
5. Check if image appears in rewards list

## Folder Structure in Storage

The app organizes images like this:

```
images/
  └── rewards/
      ├── 1735930800000-abc123.jpg
      ├── 1735930800001-def456.png
      └── ...
```

## Alternative: Use Data URLs (Temporary)

If you can't set up storage right now, the system automatically falls back to storing images as base64 data URLs in the database. This works but:

**Pros:**
- ✅ Works immediately, no setup needed
- ✅ Images stored directly in database

**Cons:**
- ❌ Increases database size significantly
- ❌ Slower page loads
- ❌ Not recommended for production

## Checking Current Status

### Check if bucket exists:

1. Open browser console (F12)
2. Go to admin rewards page
3. Try uploading an image
4. Check console for errors:
   - `Bucket not found` → Need to create bucket
   - `403 Forbidden` → Need to set up policies
   - `Success` → Everything working!

### Check in Supabase Dashboard:

1. Go to Storage → images bucket
2. Navigate to `rewards/` folder
3. You should see uploaded image files

## Getting Public URLs

Once storage is set up, images get public URLs like:

```
https://[your-project].supabase.co/storage/v1/object/public/images/rewards/1735930800000-abc123.jpg
```

These URLs:
- ✅ Are publicly accessible
- ✅ Have proper CORS headers
- ✅ Are CDN-cached for performance
- ✅ Can be used directly in `<img>` tags

## Troubleshooting

### "Bucket not found" error

**Solution:** Create the `images` bucket (see Step 2 above)

### Images upload but don't display

**Possible causes:**
1. Bucket not set to public
2. Missing storage policies
3. CORS issues

**Fix:**
1. Make sure bucket is PUBLIC ✅
2. Add the 3 storage policies above
3. Check browser console for CORS errors

### "Failed to upload image"

**Possible causes:**
1. File too large (> 5MB)
2. Wrong file type (not an image)
3. Network issue
4. Storage quota exceeded

**Fix:**
1. Use smaller images (< 5MB)
2. Only use: JPG, PNG, GIF, WebP
3. Check internet connection
4. Check Supabase storage quota in dashboard

### Images show in admin but not in user rewards page

**Cause:** Real-time subscription not working or image URL is wrong

**Fix:**
1. Check browser console for errors
2. Use the manual "Refresh" button
3. Verify image URL in database is correct

## Security Notes

### Public Bucket

Making the bucket public means:
- ✅ Anyone can VIEW images
- ❌ Only authenticated users can UPLOAD
- ❌ Only owners can DELETE

This is correct for reward images since they should be visible to all users.

### File Validation

The system validates:
- ✅ File type (only images)
- ✅ File size (max 5MB)
- ✅ Admin authentication (only admins can upload)

## Complete Setup Checklist

- [ ] Create `images` bucket in Supabase Storage
- [ ] Set bucket to **Public**
- [ ] Add "Public Access" policy (SELECT)
- [ ] Add "Authenticated Upload" policy (INSERT)
- [ ] Add "Owner Update Delete" policy (UPDATE/DELETE)
- [ ] Test upload in admin panel
- [ ] Verify image shows in admin rewards list
- [ ] Verify image shows in user rewards page
- [ ] Check Storage usage in Supabase dashboard

## After Setup

Once the storage bucket is configured:
1. All new image uploads will use Supabase Storage
2. Images will load faster (CDN-cached)
3. Database stays lean
4. You can manage images in Supabase dashboard

---

**Need Help?**

If you're still having issues:
1. Check browser console for error messages
2. Check Supabase Storage logs
3. Verify all 3 policies are active
4. Make sure bucket is PUBLIC ✅

**Expected Result:**
Images upload successfully and display immediately on both admin and user pages!
