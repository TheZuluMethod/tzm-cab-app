-- Remove the old conflicting admin policy
-- This policy tries to query auth.users which causes permission errors

-- Drop the old "Admins can view all sessions" policy
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;

-- Verify only the correct policy remains
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'sessions' 
  AND schemaname = 'public'
  AND cmd = 'SELECT';

