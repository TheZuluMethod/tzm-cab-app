-- ============================================================================
-- Storage Setup for CAB Avatars Bucket
-- ============================================================================
-- 
-- This sets up storage policies for the "CAB Avatars" bucket
-- Run this SQL in your Supabase SQL Editor
--
-- Note: The bucket "CAB Avatars" should already exist (created via Dashboard)
-- This script sets up the security policies for that bucket
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

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%avatar%';



