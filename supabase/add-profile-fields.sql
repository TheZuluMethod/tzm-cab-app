-- Add additional profile fields to users table
-- Run this SQL in your Supabase SQL Editor to add phone, company, bio, website, and avatar_url fields

-- Add new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Note: If you already ran the original schema.sql, you can run this migration
-- If you haven't run schema.sql yet, the updated schema.sql already includes these fields

