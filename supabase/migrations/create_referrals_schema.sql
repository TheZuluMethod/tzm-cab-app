-- Create referrals table to track user referrals
-- Referrers get 1 free month for each successful referral (up to 5 referrals)

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'signed_up', 'converted', 'credit_applied'
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ, -- When they became a paying customer
  credit_applied_at TIMESTAMPTZ, -- When free month credit was applied to referrer
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when they sign up
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one referral per email per referrer
  UNIQUE(referrer_id, referred_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON public.referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);

-- Add referral tracking fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS referral_credits_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_credits_remaining INTEGER DEFAULT 0;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  -- Generate a random 8-character code
  code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can refer more people (max 5)
CREATE OR REPLACE FUNCTION can_refer_more(p_referrer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM public.referrals
  WHERE referrer_id = p_referrer_id
    AND status IN ('pending', 'signed_up', 'converted', 'credit_applied');
  
  RETURN referral_count < 5;
END;
$$ LANGUAGE plpgsql;

-- Function to apply referral credit when referred user converts
CREATE OR REPLACE FUNCTION apply_referral_credit(p_referral_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_status TEXT;
BEGIN
  -- Get referral details
  SELECT referrer_id, status INTO v_referrer_id, v_referral_status
  FROM public.referrals
  WHERE id = p_referral_id;
  
  -- Check if credit already applied
  IF v_referral_status = 'credit_applied' THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE public.referrals
  SET 
    status = 'credit_applied',
    credit_applied_at = NOW(),
    updated_at = NOW()
  WHERE id = p_referral_id;
  
  -- Apply credit to referrer's subscription
  UPDATE public.subscriptions
  SET 
    referral_credits_applied = referral_credits_applied + 1,
    referral_credits_remaining = referral_credits_remaining + 1,
    updated_at = NOW()
  WHERE user_id = v_referrer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- RLS Policy: Users can create their own referrals
CREATE POLICY "Users can create their own referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- RLS Policy: System can update referrals (for conversion tracking)
CREATE POLICY "System can update referrals"
ON public.referrals
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION update_referrals_updated_at();

