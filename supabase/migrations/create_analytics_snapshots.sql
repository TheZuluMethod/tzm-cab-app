-- Create analytics_snapshots table to store historical analytics data
-- This allows tracking progression over time

CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Usage metrics
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  sessions_this_month INTEGER NOT NULL DEFAULT 0,
  sessions_last_month INTEGER NOT NULL DEFAULT 0,
  average_sessions_per_user NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Feedback type breakdown (stored as JSONB)
  feedback_type_breakdown JSONB,
  
  -- Monthly usage trend (stored as JSONB)
  monthly_usage JSONB,
  
  -- ICP profile breakdown (stored as JSONB)
  icp_industry_breakdown JSONB,
  icp_title_breakdown JSONB,
  
  -- Board member analysis (stored as JSONB)
  most_common_board_roles JSONB,
  
  -- Completion rates
  completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Report metrics
  average_report_length INTEGER NOT NULL DEFAULT 0,
  average_board_size NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Competitor analysis usage
  competitor_analysis_count INTEGER NOT NULL DEFAULT 0,
  competitor_analysis_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Top feedback items (stored as JSONB)
  top_feedback_items JSONB,
  
  -- Report quality metrics (stored as JSONB)
  report_quality_metrics JSONB,
  
  -- Report length distribution (stored as JSONB)
  report_length_distribution JSONB,
  
  -- User engagement distribution (stored as JSONB)
  user_engagement_distribution JSONB,
  
  -- Average session duration (in seconds)
  average_session_duration INTEGER NOT NULL DEFAULT 0,
  
  -- Peak usage times (stored as JSONB)
  peak_usage_times JSONB,
  
  -- Day of week usage (stored as JSONB)
  day_of_week_usage JSONB,
  
  -- ICP profile completeness (stored as JSONB)
  icp_profile_completeness JSONB,
  
  -- Full analytics data snapshot (for reference)
  full_snapshot JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON public.analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_timestamp ON public.analytics_snapshots(snapshot_timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read analytics snapshots
DROP POLICY IF EXISTS "Admins can view analytics snapshots" ON public.analytics_snapshots;
CREATE POLICY "Admins can view analytics snapshots"
  ON public.analytics_snapshots FOR SELECT
  USING (public.is_current_user_admin());

-- RLS Policy: Only admins can insert analytics snapshots
DROP POLICY IF EXISTS "Admins can insert analytics snapshots" ON public.analytics_snapshots;
CREATE POLICY "Admins can insert analytics snapshots"
  ON public.analytics_snapshots FOR INSERT
  WITH CHECK (public.is_current_user_admin());

-- Grant permissions
GRANT SELECT, INSERT ON public.analytics_snapshots TO authenticated;

COMMENT ON TABLE public.analytics_snapshots IS 'Stores historical snapshots of analytics data for tracking progression over time';
COMMENT ON COLUMN public.analytics_snapshots.snapshot_date IS 'Date of the snapshot (for daily snapshots)';
COMMENT ON COLUMN public.analytics_snapshots.full_snapshot IS 'Complete analytics data snapshot as JSONB for reference';

