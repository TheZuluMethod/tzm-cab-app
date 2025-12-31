-- Migration: Send email notification when password is changed
-- This creates a database trigger that logs password changes
-- Note: Actual email sending should be handled via Supabase Edge Function or external service

-- Create a table to track password changes (for audit and email triggers)
CREATE TABLE IF NOT EXISTS public.password_changes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_password_changes_user_id ON public.password_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_changes_changed_at ON public.password_changes(changed_at);

-- Enable RLS
ALTER TABLE public.password_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own password change records
CREATE POLICY "Users can view own password changes" ON public.password_changes
  FOR SELECT USING (auth.uid() = user_id);

-- Function to log password changes
-- Note: This is called manually from the application when password is changed
-- Supabase doesn't have a built-in trigger for password changes in auth.users
CREATE OR REPLACE FUNCTION public.log_password_change(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  change_id UUID;
BEGIN
  INSERT INTO public.password_changes (user_id, ip_address, user_agent)
  VALUES (p_user_id, p_ip_address, p_user_agent)
  RETURNING id INTO change_id;
  
  RETURN change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_password_change(UUID, TEXT, TEXT) TO authenticated;

-- Note: To send actual emails, you'll need to:
-- 1. Create a Supabase Edge Function that sends emails via SendGrid/SMTP
-- 2. Call this function from your application after password change
-- 3. Or set up a database trigger that calls the Edge Function
-- 
-- Example Edge Function call:
-- SELECT net.http_post(
--   url := 'https://your-project.supabase.co/functions/v1/send-password-change-email',
--   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'),
--   body := jsonb_build_object('user_id', p_user_id, 'email', user_email)
-- );

