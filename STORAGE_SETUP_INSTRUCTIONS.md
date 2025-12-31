# Storage Setup Instructions for "CAB Avatars" Bucket

## ✅ Bucket Created!

You've successfully created the "CAB Avatars" bucket. Now you need to set up the storage policies so users can upload and access avatars.

## 📋 Storage Setup SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- ============================================================================
-- Storage Setup for CAB Avatars Bucket
-- ============================================================================
-- 
-- This sets up storage policies for the "CAB Avatars" bucket
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Set up storage policies for CAB Avatars bucket
-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'CAB Avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'CAB Avatars');

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'CAB Avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'CAB Avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📁 File Location

The complete SQL file is also available at: `supabase/storage-setup-cab-avatars.sql`

## ✅ What This Does

1. **Upload Policy**: Allows authenticated users to upload avatars to their own folder (`{user_id}/filename.jpg`)
2. **Read Policy**: Allows anyone (public) to view avatar images
3. **Update Policy**: Allows users to update their own avatars
4. **Delete Policy**: Allows users to delete their own avatars

## 🔍 Verify It Worked

After running the SQL:

1. Go to **Storage** → **Policies** tab
2. You should see 4 policies for the "CAB Avatars" bucket:
   - Authenticated users can upload avatars
   - Public can view avatars
   - Users can update own avatars
   - Users can delete own avatars

## 🧪 Test It

1. Refresh your browser
2. Go to Account Details
3. Try uploading an avatar
4. It should work now! ✅

---

**Note**: The code has been updated to automatically detect and use the "CAB Avatars" bucket. After running the SQL above, avatar uploads should work perfectly!



