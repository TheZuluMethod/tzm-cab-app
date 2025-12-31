-- Fix: Update analytics function to use public.users instead of auth.users
-- This fixes the "permission denied for table users" error

-- Step 1: Update the helper function to use public.users table
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Use public.users table instead of auth.users (which requires special permissions)
  SELECT email INTO current_user_email
  FROM public.users
  WHERE id = auth.uid();
  
  -- If user not found in public.users, return false
  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_admin_user(current_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

