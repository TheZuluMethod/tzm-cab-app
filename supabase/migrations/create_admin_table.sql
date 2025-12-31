-- Alternative Fix: Create a simple admin_users table
-- This avoids all RLS issues by using a dedicated table

-- Step 1: Create admin_users table (no RLS needed - only functions will access it)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Insert your admin user (get your user ID first)
-- You'll need to run this query to get your user ID, then insert it:
-- SELECT id FROM auth.users WHERE email = 'hbrett@thezulumethod.com';
-- Then insert: INSERT INTO public.admin_users (user_id, email) VALUES ('YOUR_USER_ID_HERE', 'hbrett@thezulumethod.com');

-- Step 3: Create function that checks admin_users table
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user ID exists in admin_users table
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 5: Update RLS policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

