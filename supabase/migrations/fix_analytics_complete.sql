-- Complete Fix: Admin Analytics Access
-- This uses multiple fallback methods to check admin status

-- Step 1: Ensure is_admin_user function exists
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('hbrett@thezulumethod.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Function that tries JWT email first, then falls back to public.users
CREATE OR REPLACE FUNCTION public.check_admin_by_jwt_email()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Try to get email from JWT token first (if available)
  BEGIN
    user_email := (auth.jwt() ->> 'email')::TEXT;
  EXCEPTION WHEN OTHERS THEN
    user_email := NULL;
  END;
  
  -- If JWT has email, use it
  IF user_email IS NOT NULL THEN
    RETURN public.is_admin_user(user_email);
  END IF;
  
  -- Fallback: Try to get email from public.users (with error handling)
  BEGIN
    SELECT email INTO user_email
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    
    IF user_email IS NOT NULL THEN
      RETURN public.is_admin_user(user_email);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If we can't read from public.users, return false
    RETURN FALSE;
  END;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_by_jwt_email() TO authenticated;

-- Step 4: Update RLS policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.check_admin_by_jwt_email()
  );

-- Step 5: Also update the is_current_user_admin function to use the same approach
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_admin_by_jwt_email();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

