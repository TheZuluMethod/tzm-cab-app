-- Create rate_limits table for server-side rate limiting
-- This table tracks API requests to enforce rate limits per user/IP/endpoint

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL, -- User ID or IP address identifier
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip')), -- Type of identifier
  endpoint TEXT NOT NULL, -- API endpoint being rate limited
  ip_address TEXT, -- IP address (if identifier_type is 'ip')
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User ID (if identifier_type is 'user')
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON public.rate_limits(identifier, endpoint, created_at DESC);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON public.rate_limits(created_at);

-- Create index for user-based lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user 
  ON public.rate_limits(user_id, endpoint, created_at DESC) 
  WHERE user_id IS NOT NULL;

-- Create index for IP-based lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip 
  ON public.rate_limits(ip_address, endpoint, created_at DESC) 
  WHERE ip_address IS NOT NULL;

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything (for Edge Function)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policy: Users can view their own rate limit entries (for debugging)
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to automatically clean up old rate limit entries
-- This runs periodically to prevent table bloat
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete entries older than 1 hour
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- Comment on table
COMMENT ON TABLE public.rate_limits IS 'Tracks API requests for rate limiting purposes';
COMMENT ON COLUMN public.rate_limits.identifier IS 'User ID or IP address identifier';
COMMENT ON COLUMN public.rate_limits.identifier_type IS 'Type of identifier: user or ip';
COMMENT ON COLUMN public.rate_limits.endpoint IS 'API endpoint being rate limited';
COMMENT ON COLUMN public.rate_limits.created_at IS 'Timestamp when the request was made';

