# 🔍 Image Not Showing - Debug Checklist

## Follow These Steps to Find the Issue

### Step 1: Check Browser Console (MOST IMPORTANT!)

1. **Open the rewards page** (`/rewards` for users OR `/admin/rewards` for admin)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for these messages:**

#### What You Should See:

```
✅ GOOD - Images working:
🎁 Fetched rewards: 3
  - Coffee Voucher: image_url = https://...supabase.co/storage/.../image.jpg
  - Free Lunch: image_url = https://...supabase.co/storage/.../lunch.png
🖼️ Rendering image for Coffee Voucher: https://...
✅ Image loaded: Coffee Voucher
```

```
⚠️ WARNING - No images saved:
🎁 Fetched rewards: 3
  - Coffee Voucher: image_url = (none)
  - Free Lunch: image_url = (none)
⚠️ No image_url for Coffee Voucher
```

```
❌ ERROR - Images failing to load:
🎁 Fetched rewards: 3
  - Coffee Voucher: image_url = https://...
🖼️ Rendering image for Coffee Voucher: https://...
❌ Image failed to load for Coffee Voucher: https://...
[Error] Failed to load resource: 403 Forbidden
```

### Step 2: Identify the Problem

Based on console messages:

#### Problem A: "image_url = (none)"
**Cause:** Images not saved in database  
**Solution:** Go to Step 3 below

#### Problem B: "Failed to load resource: 403 Forbidden"
**Cause:** Storage bucket not public  
**Solution:** Go to Step 4 below

#### Problem C: "Failed to load resource: 404 Not Found"
**Cause:** Image file deleted or wrong URL  
**Solution:** Go to Step 5 below

#### Problem D: No logs at all
**Cause:** Page not refreshing  
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

---

### Step 3: Fix "Images Not Saved in Database"

If you see `image_url = (none)`:

1. **Go to admin panel:** `/admin/rewards`
2. **Edit the reward** (click edit icon)
3. **Upload image again**
4. **Check the console while uploading:**
   ```
   💾 Creating reward with image_url: https://...
   ✅ Reward created with ID: abc-123 Image URL in DB: https://...
   ```
5. **If you see "Storage not configured" warning:**
   - Follow `document/STORAGE_SETUP_GUIDE.md`
   - Create the "images" bucket in Supabase
6. **Save the reward**
7. **Refresh user page** and check console again

---

### Step 4: Fix "403 Forbidden" Error

If images fail with 403 error:

1. **Go to Supabase Dashboard**
2. **Storage → images bucket**
3. **Check if bucket is PUBLIC:**
   - Click on bucket name
   - Look for "Public bucket" toggle
   - Must be ✅ ON

4. **Add storage policies:**
   ```sql
   -- Run this in SQL Editor
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'images');
   ```

5. **Test again**

---

### Step 5: Fix "404 Not Found" Error

If images fail with 404:

1. **Check Supabase Storage:**
   - Go to Storage → images → rewards
   - See if image file exists
   
2. **If file missing:**
   - Re-upload image in admin panel
   
3. **If file exists but URL wrong:**
   - Check URL format should be:
     `https://[project].supabase.co/storage/v1/object/public/images/rewards/[filename]`

---

## Quick Test Commands

### Test 1: Check if rewards have images in database

Open browser console on any page and run:

```javascript
// Test rewards query
supabase
  .from('rewards')
  .select('id, name, image_url')
  .then(({ data, error }) => {
    console.log('Rewards:', data);
    data?.forEach(r => {
      console.log(`${r.name}: ${r.image_url || 'NO IMAGE'}`);
    });
  });
```

### Test 2: Check if storage is accessible

```javascript
// Test storage access
fetch('https://[your-project].supabase.co/storage/v1/bucket/images')
  .then(r => r.json())
  .then(data => console.log('Bucket:', data))
  .catch(err => console.error('Bucket error:', err));
```

### Test 3: Check if specific image loads

```javascript
// Test specific image URL (replace with your URL)
const testUrl = 'https://[your-project].supabase.co/storage/v1/object/public/images/rewards/123.jpg';
fetch(testUrl)
  .then(r => console.log('Image accessible:', r.ok))
  .catch(err => console.error('Image error:', err));
```

---

## Common Issues & Solutions

### Issue: "Real-time updates not working"

**Symptoms:** 
- Admin uploads image
- Image doesn't show on user page
- Have to manually refresh

**Solution:**
1. Check console for subscription errors
2. Click the "Refresh" button on user page
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: "Image shows in admin but not users"

**Cause:** Different query filters

**Check:**
- Is reward set to "Active"? ✅
- Does reward have `remaining_quantity > 0`?
- Check admin page vs user page queries

### Issue: "Base64 images too large"

**Symptoms:**
- Very slow page load
- `image_url` starts with `data:image/jpeg;base64,`

**Solution:**
1. Create Supabase Storage bucket
2. Re-upload images (will use storage instead)

### Issue: "Images disappear after refresh"

**Cause:** Image URLs not persisting

**Check:**
1. Verify image_url saved in database
2. Check Supabase Storage files exist
3. Verify bucket is public

---

## Expected Behavior (When Working)

### Admin Uploads Image:
1. Select image file
2. See preview immediately
3. Click "Save"
4. Console: `💾 Creating reward with image_url: https://...`
5. Console: `✅ Reward created`
6. Image shows in admin rewards list

### User Sees Image:
1. Open rewards page
2. Console: `🎁 Fetched rewards: 3`
3. Console: `🖼️ Rendering image for [reward]`
4. Console: `✅ Image loaded: [reward]`
5. Image displays in card

### Real-Time Update:
1. Admin edits reward
2. Within 2 seconds
3. User page automatically refreshes
4. New image appears

---

## Still Not Working?

### Next Steps:

1. **Share console output with me:**
   - Take screenshot of console logs
   - Include both admin and user page logs

2. **Check Supabase dashboard:**
   - Go to Storage → images
   - Screenshot bucket settings
   - Check if files exist in rewards folder

3. **Verify environment:**
   - `.env.local` has correct SUPABASE_URL
   - `.env.local` has correct SUPABASE_ANON_KEY
   - Restart dev server after changes

4. **Test with URL instead of upload:**
   - Use a public image URL (e.g., from imgur.com)
   - Paste URL directly instead of uploading
   - If this works → storage issue
   - If doesn't work → display issue

---

## Success Checklist

- [ ] Console shows fetched rewards with image URLs
- [ ] Console shows "Rendering image" messages
- [ ] Console shows "Image loaded" success messages
- [ ] No 403 or 404 errors in Network tab
- [ ] Images visible in both admin and user pages
- [ ] Real-time updates working (changes appear automatically)
- [ ] Supabase Storage shows uploaded files

---

**Debug Mode Active!** 🔍  
Follow the steps above and check your browser console for detailed logs.
