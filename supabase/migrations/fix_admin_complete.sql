-- Complete Fix: Admin Access with Proper Setup
-- Run this entire script in Supabase SQL Editor

-- Step 1: Create admin_users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Disable RLS on admin_users (we'll control access via the function)
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant SELECT to authenticated users (for the function to work)
GRANT SELECT ON public.admin_users TO authenticated;

-- Step 4: Get your user ID and insert it
-- First, let's create a function to help add admins
CREATE OR REPLACE FUNCTION public.add_admin_user(admin_email TEXT)
RETURNS UUID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;
  
  -- Insert into admin_users if found
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, email)
    VALUES (admin_user_id, admin_email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add your admin user (this will work because SECURITY DEFINER can access auth.users)
SELECT public.add_admin_user('hbrett@thezulumethod.com');

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
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT) TO authenticated;

-- Step 8: Update RLS policy on sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_current_user_admin()
  );

-- Step 9: Verify the setup
-- This should return your user ID if everything worked
SELECT user_id, email FROM public.admin_users WHERE email = 'hbrett@thezulumethod.com';

