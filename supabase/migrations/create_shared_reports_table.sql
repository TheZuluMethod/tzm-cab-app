-- Create shared_reports table for report sharing functionality
-- This table stores shareable links for reports with optional password protection and expiration

CREATE TABLE IF NOT EXISTS public.shared_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  password TEXT, -- Optional password hash
  expires_at TIMESTAMPTZ, -- Optional expiration date
  access_count INT DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups by share token
CREATE INDEX IF NOT EXISTS idx_shared_reports_token 
  ON public.shared_reports(share_token);

-- Create index for user's shared reports
CREATE INDEX IF NOT EXISTS idx_shared_reports_user 
  ON public.shared_reports(created_by, created_at DESC);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_shared_reports_session 
  ON public.shared_reports(session_id);

-- Enable RLS
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own shared reports
CREATE POLICY "Users can view own shared reports"
  ON public.shared_reports FOR SELECT
  USING (auth.uid() = created_by);

-- RLS Policy: Users can create shared reports for their own sessions
CREATE POLICY "Users can create own shared reports"
  ON public.shared_reports FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = shared_reports.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own shared reports
CREATE POLICY "Users can update own shared reports"
  ON public.shared_reports FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policy: Users can delete their own shared reports
CREATE POLICY "Users can delete own shared reports"
  ON public.shared_reports FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policy: Anyone can read shared reports by token (for public access)
-- This allows viewing shared reports without authentication
CREATE POLICY "Public can read shared reports by token"
  ON public.shared_reports FOR SELECT
  USING (true); -- Allow public read access (will be filtered by token in application)

-- Function to automatically clean up expired shared reports
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM public.shared_reports
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_expired_shared_reports() TO service_role;

-- Comment on table
COMMENT ON TABLE public.shared_reports IS 'Stores shareable links for reports';
COMMENT ON COLUMN public.shared_reports.share_token IS 'Unique token used in shareable URL';
COMMENT ON COLUMN public.shared_reports.password IS 'Optional password for password-protected shares';
COMMENT ON COLUMN public.shared_reports.expires_at IS 'Optional expiration timestamp';
COMMENT ON COLUMN public.shared_reports.access_count IS 'Number of times the shared link has been accessed';

