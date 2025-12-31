-- ============================================================================
-- Make "CAB Avatars" Bucket Public
-- ============================================================================
-- 
-- This makes the "CAB Avatars" bucket public so images can be accessed
-- via public URLs without authentication
-- ============================================================================

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'CAB Avatars';

-- Verify the bucket is now public
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'CAB Avatars';

-- You should see public = true in the results

