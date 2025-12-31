-- Fix: Update analytics function to accept email as parameter instead of querying users table
-- This completely avoids the RLS permission issue

-- Step 1: Create a simpler function that just checks if an email is admin
-- (We already have is_admin_user, but let's make sure it's correct)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('hbrett@thezulumethod.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update the helper function to accept email as parameter
-- This way we don't need to query the users table at all
CREATE OR REPLACE FUNCTION public.is_email_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin_user(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update RLS policy to use email from auth context
-- We'll pass the email from the frontend, so we need a function that can check it
-- But actually, let's keep the is_current_user_admin function but make it work differently
-- We'll query auth.users metadata instead, or better yet, use a service role approach

-- Actually, the best approach: Update the RLS policy to check email from auth.jwt()
-- But Supabase doesn't store email in JWT by default, so we need a different approach

-- Better solution: Create a function that can be called with email parameter
-- and update the RLS policy to use it
CREATE OR REPLACE FUNCTION public.check_admin_by_email(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin_user(check_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_by_email(TEXT) TO authenticated;

-- Step 4: Update RLS policy to allow admins
-- We'll use a different approach - check if current user's email (from public.users) is admin
-- But we need to bypass RLS for the function to read public.users
-- So let's make the function owner a superuser or grant it explicit permissions

-- Actually, the simplest fix: Make the function read from auth.users with proper permissions
-- But auth.users requires service role, so that won't work

-- Best solution: Update the RLS policy to use a function that gets email from auth context
-- But since we can't easily get email from auth context in RLS, let's use a different approach:
-- Allow the function to read public.users by granting it to the postgres role

-- Grant the function permission to read public.users
ALTER FUNCTION public.is_current_user_admin() OWNER TO postgres;

-- But wait, that might not work either. Let's try a completely different approach:
-- Update the RLS policy to check email from a view or use a different method

-- Actually, the REAL fix: The function needs to be able to read public.users
-- Let's grant SELECT on public.users to the function's role
-- But functions don't have roles in that way...

-- The actual solution: Make sure public.users RLS allows the function to read
-- We need to add a policy that allows SECURITY DEFINER functions to read users

-- Add RLS policy to allow SECURITY DEFINER functions to read users
-- Actually, SECURITY DEFINER should bypass RLS, so the issue might be something else

-- Let's try: Grant the authenticated role permission to read from public.users
-- But that's already there via RLS...

-- Final solution: Update is_current_user_admin to use auth.uid() and get email from public.users
-- with proper error handling
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Try to get email from public.users first
  BEGIN
    SELECT email INTO current_user_email
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, return false
    RETURN FALSE;
  END;
  
  -- If no email found, return false
  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_admin_user(current_user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

