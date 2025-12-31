-- Fix: Use JWT email instead of querying users table
-- This completely avoids RLS issues by using auth.jwt() which is always available

-- Step 1: Create function that checks admin status using JWT email
CREATE OR REPLACE FUNCTION public.check_admin_by_jwt_email()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from JWT token (available in RLS context, no table query needed)
  user_email := (auth.jwt() ->> 'email')::TEXT;
  
  -- If no email in JWT, return false
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email is admin
  RETURN public.is_admin_user(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_admin_by_jwt_email() TO authenticated;

-- Step 3: Update RLS policy to use JWT-based check
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.check_admin_by_jwt_email()
  );

