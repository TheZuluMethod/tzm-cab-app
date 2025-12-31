-- ============================================================================
-- Remove Public View Policy for Avatars
-- ============================================================================
-- 
-- This removes the "Public can view avatars" policy
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Drop the public view policy
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Verify it was removed
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND bucket_id = 'CAB Avatars'
ORDER BY policyname;

-- You should now only see 3 policies:
-- 1. Authenticated users can upload avatars
-- 2. Users can update own avatars  
-- 3. Users can delete own avatars



