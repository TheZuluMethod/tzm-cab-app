# Production Readiness Audit - Complete Checklist

**Date**: Generated automatically  
**Purpose**: Comprehensive audit of all components needed before going public on Vercel

---

## 🔴 CRITICAL - Must Complete Before Launch

### 1. Environment Variables Configuration

#### ✅ Frontend Environment Variables (`.env` file)
**Status**: Check each one below

| Variable | Required | Status | Notes |
|----------|----------|--------|-------|
| `VITE_SUPABASE_URL` | ✅ Yes | ⚠️ Verify | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | ⚠️ Verify | Supabase anonymous key (safe for frontend) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | ⚠️ Verify | Stripe publishable key (starts with `pk_test_` or `pk_live_`) |
| `VITE_STRIPE_PRICE_ID` | ✅ Yes | ⚠️ Verify | Stripe Price ID for $99/month subscription (starts with `price_`) |
| `VITE_SENDGRID_API_KEY` | ✅ Yes | ✅ Done | SendGrid API key for referral emails |
| `VITE_ANTHROPIC_API_KEY` | ✅ Yes | ⚠️ Verify | Claude AI API key |
| `VITE_GEMINI_API_KEY` | ✅ Yes | ⚠️ Verify | Google Gemini API key |
| `VITE_PERPLEXITY_API_KEY` | ✅ Yes | ⚠️ Verify | Perplexity AI API key |

**Action Required**: 
- Verify all API keys are present in `.env`
- For production, add these to **Vercel Environment Variables** (Settings → Environment Variables)

---

#### ✅ Supabase Edge Functions Secrets
**Location**: Supabase Dashboard → Settings → Edge Functions → Secrets

| Secret Name | Required | Status | Notes |
|-------------|----------|--------|-------|
| `STRIPE_SECRET_KEY` | ✅ Yes | ⚠️ Verify | Stripe secret key (starts with `sk_test_` or `sk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | ⚠️ Verify | Webhook signing secret (starts with `whsec_`) - Get after webhook setup |
| `SUPABASE_URL` | ✅ Yes | ⚠️ Verify | Your Supabase project URL (same as frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | ⚠️ Verify | Service role key (found in Supabase Settings → API) |
| `SITE_URL` | ✅ Yes | ⚠️ Verify | Production URL: `https://your-domain.vercel.app` |
| `SENDGRID_API_KEY` | ✅ Yes | ⚠️ Verify | SendGrid API key (for password reset emails) |
| `ADMIN_RECOVERY_KEY` | ⚠️ Optional | ⚠️ Verify | Strong random string for admin recovery (if using Option 1) |

**Action Required**: 
- Add all secrets to Supabase Edge Functions secrets
- **CRITICAL**: Never commit these to Git!

---

### 2. Database Migrations

**Location**: Supabase Dashboard → SQL Editor

Run these migrations **in order**:

#### ✅ Core Tables (Required)
- [ ] `supabase/schema.sql` - Creates `users` and `sessions` tables
- [ ] `supabase/migrations/create_subscriptions_schema.sql` - Creates subscriptions, events, payment_intents tables
- [ ] `supabase/migrations/create_referrals_schema.sql` - Creates referrals table and functions
- [ ] `supabase/migrations/create_shared_reports_table.sql` - Creates shared_reports table
- [ ] `supabase/migrations/create_rate_limits_table.sql` - Creates rate_limits table (if using rate limiting)

#### ✅ Admin Setup (Required)
- [ ] `supabase/migrations/add_super_admin_column.sql` - Adds `is_super_admin` column (Option 1)
- [ ] OR `supabase/migrations/create_admin_table.sql` - Creates admin_users table (Option 2)

#### ✅ Additional Features (Optional but Recommended)
- [ ] `supabase/migrations/add_password_change_email_trigger.sql` - Password change email notifications
- [ ] `supabase/migrations/add_draft_session_fields.sql` - Draft session recovery fields
- [ ] `supabase/migrations/add_competitor_analysis_column.sql` - Competitor analysis storage

**Action Required**: 
- Copy each migration file content
- Run in Supabase SQL Editor
- Verify tables exist: Supabase Dashboard → Table Editor

---

### 3. Supabase Edge Functions Deployment

**Location**: Supabase Dashboard → Edge Functions

#### ✅ Required Functions

| Function Name | Status | Purpose | Required Secrets |
|---------------|--------|---------|------------------|
| `create-checkout-session` | ⚠️ Deploy | Creates Stripe checkout sessions | `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` |
| `stripe-webhook` | ⚠️ Deploy | Handles Stripe webhook events | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `admin-recovery` | ⚠️ Deploy | Admin account recovery | `ADMIN_RECOVERY_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `send-password-change-email` | ⚠️ Deploy | Password change notifications | `SENDGRID_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

#### ✅ Optional Functions
- `rate-limit` - Rate limiting (if using)
- `rate-limit-cleanup` - Cleanup job (if using)
- `rate-limit-metrics` - Metrics (if using)

**Deployment Steps**:
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy function: `supabase functions deploy create-checkout-session`
5. Deploy function: `supabase functions deploy stripe-webhook`
6. Deploy function: `supabase functions deploy admin-recovery`
7. Deploy function: `supabase functions deploy send-password-change-email`

**OR** use Supabase Dashboard:
1. Go to Edge Functions
2. Click "Create Function"
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Paste and deploy

**Action Required**: 
- Deploy all required functions
- Verify each function has correct secrets configured
- Test each function endpoint

---

### 4. Stripe Configuration

#### ✅ Stripe Dashboard Setup

**Location**: https://dashboard.stripe.com/

1. **Product & Price Creation**
   - [ ] Create Product: "AI Advisory Board - Monthly Subscription"
   - [ ] Create Price: $99/month (recurring)
   - [ ] Copy Price ID (starts with `price_`)
   - [ ] Add to `.env`: `VITE_STRIPE_PRICE_ID=price_XXXXX`

2. **Webhook Endpoint Configuration**
   - [ ] Go to: Developers → Webhooks → Add endpoint
   - [ ] Endpoint URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
   - [ ] Events to subscribe:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
   - [ ] Copy Webhook Signing Secret (starts with `whsec_`)
   - [ ] Add to Supabase Edge Functions secrets: `STRIPE_WEBHOOK_SECRET`

3. **API Keys**
   - [ ] Copy Publishable Key (starts with `pk_test_` or `pk_live_`)
   - [ ] Add to `.env`: `VITE_STRIPE_PUBLISHABLE_KEY=pk_XXXXX`
   - [ ] Copy Secret Key (starts with `sk_test_` or `sk_live_`)
   - [ ] Add to Supabase Edge Functions secrets: `STRIPE_SECRET_KEY`

**Action Required**: 
- Complete Stripe setup
- Test checkout flow end-to-end
- Verify webhook events are received

---

### 5. SendGrid Configuration

#### ✅ SendGrid Dashboard Setup

**Location**: https://app.sendgrid.com/

1. **API Key**
   - [ ] Create API Key with "Full Access" permissions
   - [ ] Copy API Key
   - [ ] Add to `.env`: `VITE_SENDGRID_API_KEY=SG.XXXXX`
   - [ ] Add to Supabase Edge Functions secrets: `SENDGRID_API_KEY`

2. **Sender Verification**
   - [ ] Verify sender email address
   - [ ] Or verify domain (recommended for production)

3. **Email Templates** (Optional - can create via API)
   - [ ] Referral email template
   - [ ] Password change notification template

**Action Required**: 
- Verify SendGrid API key works
- Test sending referral email
- Test password reset email

---

### 6. AI API Keys Configuration

#### ✅ Required AI Services

| Service | API Key Location | Status | Notes |
|---------|-----------------|--------|-------|
| **Google Gemini** | https://aistudio.google.com/apikey | ⚠️ Verify | Required for report generation |
| **Perplexity AI** | https://www.perplexity.ai/settings/api | ⚠️ Verify | Required for research |
| **Anthropic Claude** | https://console.anthropic.com/ | ⚠️ Verify | Required for verification |

**Action Required**: 
- Verify all API keys are in `.env` file
- Test report generation to ensure all APIs work
- Check API quotas/limits

---

### 7. Domain & Production URL

#### ✅ Vercel Deployment

1. **Deploy to Vercel**
   - [ ] Connect GitHub repository to Vercel
   - [ ] Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Framework Preset: `Vite`
   - [ ] Add all environment variables (from `.env` file)
   - [ ] Deploy

2. **Custom Domain** (Optional)
   - [ ] Add custom domain in Vercel
   - [ ] Update `SITE_URL` in Supabase Edge Functions secrets
   - [ ] Update Stripe webhook endpoint URL

**Action Required**: 
- Deploy to Vercel
- Update `SITE_URL` in Supabase secrets
- Test production URL

---

## 🟡 IMPORTANT - Should Complete Before Launch

### 8. Security Review

- [ ] Verify no secrets in Git repository
- [ ] Verify `.gitignore` includes `.env`
- [ ] Verify RLS policies are enabled on all tables
- [ ] Verify admin recovery key is strong and secure
- [ ] Verify domain restrictions are working (non-admin users)
- [ ] Verify trial limits are enforced

### 9. Testing Checklist

#### ✅ Core Functionality
- [ ] User signup and login
- [ ] Trial report generation (1 free report)
- [ ] Upgrade flow (Stripe checkout)
- [ ] Subscription activation (webhook)
- [ ] Report sharing
- [ ] Report export (PDF/HTML)
- [ ] Saved reports loading
- [ ] Account details update
- [ ] Referral system
- [ ] Password reset

#### ✅ Edge Cases
- [ ] Trial user tries to share report (should redirect to upgrade)
- [ ] Trial user tries to run second report (should show upgrade screen)
- [ ] Non-admin user tries competitor research (should be blocked)
- [ ] Admin user can research any domain
- [ ] Subscription renewal
- [ ] Payment failure handling
- [ ] Webhook retry handling

### 10. Performance & Monitoring

- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics, Plausible)
- [ ] Monitor API usage (Gemini, Perplexity, Claude)
- [ ] Monitor Stripe webhook delivery
- [ ] Set up uptime monitoring
- [ ] Review and optimize report generation speed

---

## 🟢 NICE TO HAVE - Can Add After Launch

### 11. Additional Features

- [ ] Email notifications for report completion
- [ ] Email digest of saved reports
- [ ] Advanced analytics dashboard
- [ ] User feedback system
- [ ] Help documentation
- [ ] Support chat widget
- [ ] Blog/content marketing pages

---

## 📋 Quick Reference: Environment Variables Summary

### Frontend (`.env` and Vercel)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_ID=price_xxxxx
VITE_SENDGRID_API_KEY=SG.xxxxx
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
VITE_GEMINI_API_KEY=xxxxx
VITE_PERPLEXITY_API_KEY=pplx-xxxxx
```

### Supabase Edge Functions Secrets
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SITE_URL=https://your-app.vercel.app
SENDGRID_API_KEY=SG.xxxxx
ADMIN_RECOVERY_KEY=your-strong-random-string-here
```

---

## 🚨 Critical Missing Items Checklist

Based on your screenshots, here's what needs immediate attention:

### From Screenshot #1 & #2 (Environment Variables)
- [ ] Verify `VITE_STRIPE_PRICE_ID` is set (you have `VITE_STRIPE_PRICE_ID` listed)
- [ ] Verify `SITE_URL` is set in Supabase Edge Functions secrets
- [ ] Verify `STRIPE_WEBHOOK_SECRET` is set (get from Stripe after webhook creation)

### From Screenshot #3 & #4 (Edge Functions)
- [ ] Deploy `create-checkout-session` function
- [ ] Deploy `stripe-webhook` function (you have `stripe-webhook-handler` listed - verify it's the same)
- [ ] Deploy `admin-recovery` function
- [ ] Deploy `send-password-change-email` function
- [ ] Remove old/unused functions: `create-stripe-checkout`, `create-stripe-checkout-old`

---

## ✅ Final Pre-Launch Checklist

Before going public:

1. **Environment Variables**
   - [ ] All frontend variables in `.env` and Vercel
   - [ ] All backend secrets in Supabase Edge Functions

2. **Database**
   - [ ] All migrations run successfully
   - [ ] All tables exist and have RLS enabled
   - [ ] Test data can be inserted/queried

3. **Edge Functions**
   - [ ] All functions deployed
   - [ ] All functions have correct secrets
   - [ ] All functions tested and working

4. **Stripe**
   - [ ] Product and Price created
   - [ ] Webhook endpoint configured
   - [ ] Webhook events subscribed
   - [ ] Test checkout flow works

5. **SendGrid**
   - [ ] API key configured
   - [ ] Sender verified
   - [ ] Test emails work

6. **AI APIs**
   - [ ] All API keys configured
   - [ ] Test report generation works
   - [ ] Check API quotas

7. **Vercel**
   - [ ] App deployed
   - [ ] Environment variables added
   - [ ] Custom domain configured (if applicable)
   - [ ] Production URL works

8. **Testing**
   - [ ] End-to-end user flow tested
   - [ ] Payment flow tested
   - [ ] Error handling tested
   - [ ] Security tested

---

## 📞 Support & Next Steps

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Edge Functions → Logs
2. **Check Stripe Logs**: Dashboard → Developers → Logs
3. **Check Vercel Logs**: Vercel Dashboard → Deployments → Logs
4. **Check Browser Console**: For frontend errors

**Ready to Launch?** ✅ Complete all items marked with ✅ and ⚠️ above!

