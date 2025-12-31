-- ============================================================================
-- CREATE AUTOMATIC MIGRATION FUNCTION
-- ============================================================================
-- 
-- This creates a function that can be called from the app to automatically
-- add missing columns. This allows the app to migrate itself!
--
-- Run this ONCE in Supabase SQL Editor, then the app can call it automatically.
-- ============================================================================

-- Create function to add profile columns if they don't exist
CREATE OR REPLACE FUNCTION public.add_profile_columns()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Required to allow ALTER TABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Add columns if they don't exist
  ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Columns added successfully'
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_profile_columns() TO authenticated;

-- Test the function
SELECT public.add_profile_columns();

