# Avatar Upload Fix

The avatar upload error has been fixed with better error handling. Here's what you need to do:

## ✅ Code Fixes Applied

1. **Better Error Messages** - Now shows specific errors if bucket doesn't exist or permissions are wrong
2. **Bucket Check** - Verifies the avatars bucket exists before attempting upload
3. **Graceful Failure** - Profile update continues even if avatar upload fails (shows warning)
4. **Path Fix** - Corrected file path structure for user-specific folders

## 🔧 Setup Required

### Step 1: Create Storage Bucket

You need to create the `avatars` storage bucket in Supabase:

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Set:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Checked (so avatars can be viewed)
5. Click **Create bucket**

**Option B: Via SQL (Alternative)**
1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Set Up Storage Policies

After creating the bucket, set up the storage policies:

1. Go to **Storage** → **Policies** (or run the SQL below)
2. Run this SQL in **SQL Editor**:

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

**Or use the complete file**: `supabase/storage-setup.sql` (already updated with correct policies)

## 🧪 Test

After setting up the bucket and policies:

1. Refresh your browser
2. Go to Account Details (click your email → Account)
3. Try uploading an avatar
4. It should work now!

## 📝 What Changed

- ✅ Better error detection and messages
- ✅ Checks if bucket exists before upload
- ✅ Profile update continues even if avatar fails
- ✅ Corrected file path structure (`{user_id}/{filename}`)
- ✅ Updated storage policies to match file structure

---

**Note**: The error message will now tell you exactly what's wrong (bucket missing, permissions, etc.) to help debug any remaining issues.

