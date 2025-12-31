-- Migration: Add draft session support fields
-- Run this SQL in your Supabase SQL Editor if you have an existing database

-- Add status column to track draft vs complete sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add app_state column to track where user was in the flow
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS app_state TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.sessions.status IS 'Session status: draft (in progress) or complete (finished)';
COMMENT ON COLUMN public.sessions.app_state IS 'Current app state when saved (for recovery)';

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON public.sessions(user_id, status);

-- Update existing sessions to 'complete' status (they were finished)
UPDATE public.sessions 
SET status = 'complete' 
WHERE status IS NULL OR status = 'draft';

