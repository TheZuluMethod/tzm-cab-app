-- Migration: Add analytics function for app maker/admin
-- This function allows admins to fetch aggregate analytics data across all users
-- Run this in Supabase SQL Editor

-- Function to check if user is admin (by email)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Add your admin email(s) here
  RETURN user_email IN (
    'hbrett@thezulumethod.com' -- Update this to your actual admin email
    -- Add more admin emails as needed:
    -- , 'another-admin@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregate analytics data (only accessible by admins)
CREATE OR REPLACE FUNCTION public.get_analytics_data()
RETURNS TABLE (
  total_sessions BIGINT,
  total_users BIGINT,
  sessions_this_month BIGINT,
  sessions_last_month BIGINT,
  avg_sessions_per_user NUMERIC
) AS $$
DECLARE
  current_user_email TEXT;
  this_month_start TIMESTAMPTZ;
  last_month_start TIMESTAMPTZ;
  this_month_end TIMESTAMPTZ;
BEGIN
  -- Get current user's email
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if user is admin
  IF NOT public.is_admin_user(current_user_email) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Calculate date ranges
  this_month_start := date_trunc('month', NOW());
  last_month_start := date_trunc('month', NOW() - INTERVAL '1 month');
  this_month_end := date_trunc('month', NOW() + INTERVAL '1 month');

  -- Return aggregate data
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'complete')::BIGINT as total_sessions,
    COUNT(DISTINCT user_id)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE status = 'complete' AND created_at >= this_month_start AND created_at < this_month_end)::BIGINT as sessions_this_month,
    COUNT(*) FILTER (WHERE status = 'complete' AND created_at >= last_month_start AND created_at < this_month_start)::BIGINT as sessions_last_month,
    CASE
      WHEN COUNT(DISTINCT user_id) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE status = 'complete')::NUMERIC / COUNT(DISTINCT user_id), 2)
      ELSE 0
    END as avg_sessions_per_user
  FROM public.sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_data() TO authenticated;

-- RLS Policy: Update existing policy to allow admins to read all sessions
-- First, drop the existing policy
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

-- Then recreate it with admin support
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );
