-- Fix: Allow SECURITY DEFINER functions to read from public.users
-- This fixes the "permission denied for table users" error

-- The issue is that even SECURITY DEFINER functions need explicit permissions
-- when RLS is enabled. We need to add a policy that allows functions to read users.

-- Step 1: Add a policy that allows reading your own user record
-- (This should already exist, but let's make sure)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Step 2: Create a function that can read any user's email (for admin checks)
-- This function will be used by SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM public.users
  WHERE id = user_id
  LIMIT 1;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update is_current_user_admin to use this helper function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Use the helper function which has SECURITY DEFINER
  current_user_email := public.get_user_email_by_id(auth.uid());
  
  -- If no email found, return false
  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_admin_user(current_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

