-- ============================================================================
-- Option 1: Add is_super_admin Column for Enhanced Admin Recovery
-- ============================================================================
-- This migration adds a super admin flag that can be set via recovery function
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add is_super_admin column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON public.users(is_super_admin) 
WHERE is_super_admin = TRUE;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.users.is_super_admin IS 
'Super admin flag set via recovery function. Requires ADMIN_RECOVERY_KEY.';

-- Step 4: Grant permissions (users can read their own flag)
GRANT SELECT (is_super_admin) ON public.users TO authenticated;

-- Step 5: Create function to check super admin status
CREATE OR REPLACE FUNCTION public.is_user_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_super BOOLEAN;
BEGIN
  SELECT COALESCE(is_super_admin, FALSE) INTO is_super
  FROM public.users
  WHERE email = user_email
  LIMIT 1;
  
  RETURN COALESCE(is_super, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 6: Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_user_super_admin(TEXT) TO authenticated;

-- Step 7: Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'is_super_admin';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ is_super_admin column added successfully!';
  RAISE NOTICE 'Next: Create the recovery Edge Function (see supabase/functions/admin-recovery/index.ts)';
END $$;
