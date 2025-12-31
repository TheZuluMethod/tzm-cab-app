-- ============================================================================
-- QUICK FIX: Add avatar_url column to users table
-- ============================================================================
-- 
-- This is a minimal migration to add just the avatar_url column
-- Run this if you're getting the "Could not find the 'avatar_url' column" error
--
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
-- 2. Click SQL Editor → New Query
-- 3. Copy and paste this entire file
-- 4. Click Run
-- ============================================================================

-- Add avatar_url column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'avatar_url'
  ) THEN
    RAISE NOTICE '✅ avatar_url column added successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to add avatar_url column';
  END IF;
END $$;

-- Show current users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

