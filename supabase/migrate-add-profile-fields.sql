-- Migration: Add Profile Fields to Users Table
-- 
-- Run this SQL in your Supabase SQL Editor to add missing profile fields
-- This is safe to run multiple times (uses IF NOT EXISTS)
--
-- This migration adds:
-- - phone (TEXT)
-- - company (TEXT) 
-- - bio (TEXT)
-- - website (TEXT)
-- - avatar_url (TEXT)

-- Add new columns to users table (safe to run multiple times)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify columns were added (this will show any errors)
DO $$
BEGIN
  -- Check if columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'avatar_url'
  ) THEN
    RAISE EXCEPTION 'Failed to add avatar_url column';
  END IF;
  
  RAISE NOTICE 'All profile fields added successfully!';
END $$;

-- Display current users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

