-- Complete the admin setup (run this if you only ran part of the previous script)

-- Step 6: Create the admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check admin_users table (no RLS, so this should work)
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 8: Update RLS policy on sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

-- Test the function (should return true for you)
SELECT public.is_current_user_admin() as is_admin;

