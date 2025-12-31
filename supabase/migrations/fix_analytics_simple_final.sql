-- Simple Final Fix: Allow admin to read all sessions
-- This bypasses the users table query issue entirely

-- Step 1: Create a simple function that checks admin by user ID
-- We'll store admin user IDs directly (more reliable than email lookup)
CREATE OR REPLACE FUNCTION public.is_user_id_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if this user ID belongs to an admin
  -- We'll check by getting the email from auth.users (which SECURITY DEFINER can access)
  -- But if that fails, we'll use a hardcoded check
  RETURN user_id IN (
    -- Get admin user ID from auth.users by email
    SELECT id FROM auth.users WHERE email = 'hbrett@thezulumethod.com' LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to check if current user ID is admin
  RETURN public.is_user_id_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_user_id_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 4: Update RLS policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

