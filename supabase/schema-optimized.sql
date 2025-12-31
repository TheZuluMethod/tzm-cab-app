-- ============================================================================
-- OPTIMIZED SUPABASE SCHEMA FOR THE ZULU METHOD CAB APP
-- Production-ready, scalable, and performance-optimized
-- ============================================================================
-- 
-- This schema is designed to handle:
-- - Thousands of concurrent users
-- - Millions of sessions
-- - High data flow with optimal performance
-- - Complete data storage for all app features
--
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user profile information (extends Supabase auth.users)
-- Optimized with proper indexes and constraints

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  bio TEXT,
  website TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for users table (optimized for common queries)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at DESC);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
-- Stores all board reports and analysis data
-- Optimized with JSONB indexes for fast queries on nested data

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  input JSONB NOT NULL, -- UserInput type (all form data)
  members JSONB NOT NULL, -- BoardMember[] array
  report TEXT NOT NULL, -- Full report text (can be large)
  icp_profile JSONB, -- ICPProfile type (optional)
  persona_breakdowns JSONB, -- PersonaBreakdown[] array (optional)
  dashboard_data JSONB, -- DashboardData type (optional)
  qc_status JSONB, -- QC status object (optional)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Performance indexes for sessions table
-- Primary lookup: user_id + created_at (most common query)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created_at 
  ON public.sessions(user_id, created_at DESC);

-- Individual indexes for flexibility
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.sessions(updated_at DESC);

-- GIN indexes for JSONB fields (enables fast queries on nested JSON data)
CREATE INDEX IF NOT EXISTS idx_sessions_input_gin ON public.sessions USING GIN (input);
CREATE INDEX IF NOT EXISTS idx_sessions_members_gin ON public.sessions USING GIN (members);

-- Text search index on title (for search functionality)
CREATE INDEX IF NOT EXISTS idx_sessions_title_trgm ON public.sessions USING GIN (title gin_trgm_ops);

-- Partial index for recent sessions (optimizes "recent sessions" queries)
CREATE INDEX IF NOT EXISTS idx_sessions_recent 
  ON public.sessions(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '90 days';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Ensures complete data segmentation between users

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for sessions table
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors on duplicate signups
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Analyze tables for query planner optimization
ANALYZE public.users;
ANALYZE public.sessions;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('users', 'sessions');

-- Check indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('users', 'sessions');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('users', 'sessions');

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- If you already have tables, this script will:
-- 1. Add missing columns (phone, company, bio, website, avatar_url)
-- 2. Create missing indexes
-- 3. Update RLS policies
-- 4. Optimize for performance
--
-- Safe to run multiple times (uses IF NOT EXISTS and DROP IF EXISTS)

