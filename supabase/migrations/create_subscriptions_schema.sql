-- Subscription and Trial Management Schema
-- Run this in Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'canceled', 'past_due', 'expired'
  plan_type TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'monthly'
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ DEFAULT NOW(),
  trial_end TIMESTAMPTZ,
  reports_used INTEGER DEFAULT 0,
  reports_limit INTEGER DEFAULT 1, -- 1 for trial, 10 for monthly
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create subscription_events table for tracking conversions, churn, etc.
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'trial_started', 'trial_completed', 'upgrade_initiated', 'upgrade_completed', 'checkout_started', 'checkout_abandoned', 'subscription_canceled', 'subscription_renewed', 'payment_failed'
  metadata JSONB, -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create payment_intents table for tracking checkout attempts
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_checkout_session_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled', 'abandoned'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_events (users can only see their own events)
CREATE POLICY "Users can view own subscription events"
  ON public.subscription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription events"
  ON public.subscription_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payment_intents
CREATE POLICY "Users can view own payment intents"
  ON public.payment_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment intents"
  ON public.payment_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment intents"
  ON public.payment_intents FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can view all subscriptions (for analytics)
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all subscription events"
  ON public.subscription_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment intents"
  ON public.payment_intents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to automatically create trial subscription on user signup
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan_type,
    trial_start,
    trial_end,
    reports_used,
    reports_limit
  ) VALUES (
    NEW.id,
    'trial',
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days', -- 30 day trial period
    0,
    1 -- Only 1 report allowed in trial
  );
  
  -- Log trial started event
  INSERT INTO public.subscription_events (
    user_id,
    event_type,
    metadata
  ) VALUES (
    NEW.id,
    'trial_started',
    jsonb_build_object('trial_end', NOW() + INTERVAL '30 days')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create trial subscription when user is created
DROP TRIGGER IF EXISTS on_user_created_create_trial ON public.users;
CREATE TRIGGER on_user_created_create_trial
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

