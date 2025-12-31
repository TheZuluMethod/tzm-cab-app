-- Migration: Add analytics function for app maker/admin (Simplified Version)
-- This function allows admins to fetch aggregate analytics data across all users
-- Run this in Supabase SQL Editor

-- Step 1: Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('hbrett@thezulumethod.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN public.is_admin_user(current_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 4: Update RLS policy to allow admins to read all sessions
-- Note: We'll use a simpler approach - check admin status via email in metadata
-- But first, let's create a function that doesn't need to query users table
CREATE OR REPLACE FUNCTION public.check_admin_by_auth_email()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Try to get email from auth.users metadata (doesn't require RLS bypass)
  -- This uses auth.jwt() which is available in RLS context
  user_email := (auth.jwt() ->> 'email')::TEXT;
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_admin_user(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.check_admin_by_auth_email() TO authenticated;

-- Step 5: Update RLS policy to use the new function
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.check_admin_by_auth_email()
  );

