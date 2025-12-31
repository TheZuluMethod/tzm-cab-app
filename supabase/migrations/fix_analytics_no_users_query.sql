-- Final Fix: Store admin user ID directly (no user table query needed)
-- This completely avoids the RLS permission issue

-- Step 1: Create a simple function that checks admin by user ID directly
-- We'll get your user ID from auth.users and hardcode it, or use a lookup table

-- First, let's create a simple admin lookup function
-- We'll get your actual user ID and use it directly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  admin_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get admin user ID by email from auth.users (SECURITY DEFINER should allow this)
  -- If this fails, we'll catch it and return false
  BEGIN
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'hbrett@thezulumethod.com'
    LIMIT 1;
    
    -- If we found an admin user ID, check if current user matches
    IF admin_user_id IS NOT NULL AND current_user_id = admin_user_id THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If we can't query auth.users, return false
    RETURN FALSE;
  END;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 3: Update RLS policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

-- Alternative approach: If the above still doesn't work, we can create a simple admin table
-- But let's try the function approach first

