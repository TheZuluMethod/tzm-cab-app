# Create Storage Bucket - Quick Guide

## ✅ Good News!

The `avatar_url` column exists in your database! The issue is the **storage bucket** doesn't exist yet.

## How Avatar Storage Works

1. **Image File** → Uploaded to **Supabase Storage** (bucket: `avatars`)
2. **Public URL** → Retrieved from storage (e.g., `https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/filename.jpg`)
3. **URL Saved** → Stored in `users.avatar_url` column in database
4. **Display** → App loads image from the URL

**We ARE storing the actual image file** - not just a reference! The URL is just how we access it.

## 🔧 Quick Fix: Create Storage Bucket

### Option 1: Via Supabase Dashboard (Easiest - 30 seconds)

1. Go to: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
2. Click **Storage** in the left sidebar
3. Click **New bucket** button
4. Fill in:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Check this box** (so images can be viewed)
5. Click **Create bucket**

### Option 2: Via SQL (Alternative)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Set Up Storage Policies

After creating the bucket, you need to set up permissions. Run this SQL:

```sql
-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

Or use the complete file: `supabase/storage-setup.sql`

## ✅ Verify It Worked

1. Go to **Storage** → You should see `avatars` bucket
2. Try uploading an avatar in Account Details
3. Check **Storage** → `avatars` → You should see your uploaded image file
4. Check **Table Editor** → `users` → `avatar_url` should now have a URL (not NULL)

## 📋 What Gets Stored

- **In Supabase Storage**: The actual image file (JPG, PNG, GIF)
- **In Database**: The URL to access that file
- **Location**: `avatars/{user_id}/{timestamp_filename.jpg}`

---

**After creating the bucket and policies, try uploading an avatar again - it should work!** 🎉

