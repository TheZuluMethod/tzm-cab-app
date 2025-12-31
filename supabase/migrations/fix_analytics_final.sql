-- Final Fix: Allow admin check function to read from public.users
-- This fixes the "permission denied for table users" error

-- Step 1: Create a helper function that can read user email (with SECURITY DEFINER)
-- This function will bypass RLS because it uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- This function uses SECURITY DEFINER so it can read from public.users
  -- even when RLS is enabled
  SELECT email INTO user_email
  FROM public.users
  WHERE id = user_id
  LIMIT 1;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update is_current_user_admin to use the helper function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Use the helper function which has SECURITY DEFINER and can bypass RLS
  current_user_email := public.get_user_email_by_id(auth.uid());
  
  -- If no email found, return false
  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the email is an admin email
  RETURN public.is_admin_user(current_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;

