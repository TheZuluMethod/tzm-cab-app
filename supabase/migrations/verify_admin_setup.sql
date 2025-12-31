-- Verify Admin Setup
-- Run this to check if everything is configured correctly

-- 1. Check if admin_users table exists and has your user
SELECT user_id, email, created_at 
FROM public.admin_users 
WHERE email = 'hbrett@thezulumethod.com';

-- 2. Check what auth.uid() returns (will be NULL in SQL editor, that's normal)
SELECT auth.uid() as current_user_id;

-- 3. Test the function with your actual user ID directly
-- Replace 'c1db566b-5bb9-4b55-b0a3-500850e4be3c' with your actual user_id if different
SELECT EXISTS (
  SELECT 1 
  FROM public.admin_users 
  WHERE user_id = 'c1db566b-5bb9-4b55-b0a3-500850e4be3c'::UUID
) as should_be_true;

-- 4. Verify the function exists and has correct permissions
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'is_current_user_admin';

-- 5. Check RLS policies on sessions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sessions' AND schemaname = 'public';

