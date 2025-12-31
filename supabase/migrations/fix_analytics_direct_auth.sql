-- Final Fix: Query auth.users directly (SECURITY DEFINER can access it)
-- This should work because SECURITY DEFINER functions run with elevated privileges

-- Step 1: Function to check if current user is admin by querying auth.users directly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Query auth.users directly - SECURITY DEFINER should allow this
  -- auth.users is a system table that SECURITY DEFINER functions can access
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- If no email found, return false
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email is admin
  RETURN public.is_admin_user(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure is_admin_user function exists
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('hbrett@thezulumethod.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 4: Update RLS policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

