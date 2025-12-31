-- Migration: Add competitor_analysis column to sessions table
-- Run this SQL in your Supabase SQL Editor if you have an existing database

-- Add competitor_analysis column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS competitor_analysis JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.sessions.competitor_analysis IS 'CompetitorAnalysisResult type (optional, for competitor breakdown reports)';

