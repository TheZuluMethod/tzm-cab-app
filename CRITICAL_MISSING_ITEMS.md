# Critical Missing Items - Action Required

Based on the audit of your environment variables and Edge Functions, here are the **most critical items** that must be completed before going public:

---

## 🔴 TOP PRIORITY - Blocking Launch

### 1. **Stripe Webhook Secret Missing**
**Status**: ❌ Missing  
**Impact**: Subscription activations won't work after payment

**Action Required**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create webhook endpoint: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret** (starts with `whsec_`)
5. Add to Supabase Edge Functions secrets as `STRIPE_WEBHOOK_SECRET`

---

### 2. **SITE_URL Not Set in Supabase Secrets**
**Status**: ⚠️ May be missing  
**Impact**: Stripe checkout redirects won't work correctly

**Action Required**:
1. Get your production URL (e.g., `https://your-app.vercel.app`)
2. Add to Supabase Edge Functions secrets as `SITE_URL`
3. This is used in `create-checkout-session` for success/cancel URLs

---

### 3. **Edge Functions Not Deployed**
**Status**: ⚠️ Need verification  
**Impact**: Payment flow completely broken

**Critical Functions to Deploy**:
- `create-checkout-session` - Creates Stripe checkout
- `stripe-webhook` - Processes Stripe events
- `admin-recovery` - Admin account recovery
- `send-password-change-email` - Password reset emails

**Action Required**:
1. Use Supabase CLI or Dashboard to deploy each function
2. Verify each function has correct secrets configured
3. Test each function endpoint

**Quick Deploy Command**:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy admin-recovery
supabase functions deploy send-password-change-email
```

---

### 4. **Database Migrations Not Run**
**Status**: ⚠️ Need verification  
**Impact**: App won't work - tables don't exist

**Critical Migrations**:
1. `supabase/schema.sql` - Creates `users` and `sessions` tables
2. `supabase/migrations/create_subscriptions_schema.sql` - Creates subscription tables
3. `supabase/migrations/create_referrals_schema.sql` - Creates referral system
4. `supabase/migrations/create_shared_reports_table.sql` - Creates sharing functionality
5. `supabase/migrations/add_super_admin_column.sql` - Admin setup

**Action Required**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run each migration file
3. Verify tables exist: Dashboard → Table Editor

---

## 🟡 HIGH PRIORITY - Should Fix Before Launch

### 5. **VITE_STRIPE_PRICE_ID Verification**
**Status**: ⚠️ Need verification  
**Impact**: Checkout won't know which product to charge

**Action Required**:
1. Go to Stripe Dashboard → Products
2. Find your $99/month product
3. Copy the **Price ID** (starts with `price_`)
4. Verify it's in `.env` as `VITE_STRIPE_PRICE_ID`
5. Add to Vercel environment variables for production

---

### 6. **SendGrid API Key in Supabase Secrets**
**Status**: ⚠️ May be missing  
**Impact**: Password reset emails won't work

**Action Required**:
1. Copy your SendGrid API key
2. Add to Supabase Edge Functions secrets as `SENDGRID_API_KEY`
3. This is used by `send-password-change-email` function

---

### 7. **Remove Old/Unused Edge Functions**
**Status**: ⚠️ Cleanup needed  
**Impact**: Confusion, potential security issues

**Functions to Remove**:
- `create-stripe-checkout` (old version)
- `create-stripe-checkout-old` (old version)

**Action Required**:
1. Go to Supabase Dashboard → Edge Functions
2. Delete unused functions
3. Keep only: `create-checkout-session`, `stripe-webhook`, `admin-recovery`, `send-password-change-email`

---

## 🟢 MEDIUM PRIORITY - Nice to Have

### 8. **AI API Keys Verification**
**Status**: ⚠️ Need verification  
**Impact**: Report generation may fail

**Action Required**:
- Verify all AI API keys are in `.env`:
  - `VITE_GEMINI_API_KEY`
  - `VITE_PERPLEXITY_API_KEY`
  - `VITE_ANTHROPIC_API_KEY`
- Test report generation to ensure all APIs work

---

### 9. **Vercel Environment Variables**
**Status**: ⚠️ Need setup  
**Impact**: Production app won't work

**Action Required**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env` file (with `VITE_` prefix)
3. Set for "Production" environment
4. Redeploy after adding variables

---

## 📋 Quick Action Checklist

**Do These NOW** (in order):

1. [ ] Run all database migrations in Supabase SQL Editor
2. [ ] Deploy all Edge Functions to Supabase
3. [ ] Create Stripe webhook endpoint and get `STRIPE_WEBHOOK_SECRET`
4. [ ] Add `STRIPE_WEBHOOK_SECRET` to Supabase Edge Functions secrets
5. [ ] Add `SITE_URL` to Supabase Edge Functions secrets (your Vercel URL)
6. [ ] Add `SENDGRID_API_KEY` to Supabase Edge Functions secrets
7. [ ] Verify `VITE_STRIPE_PRICE_ID` is correct in `.env`
8. [ ] Add all environment variables to Vercel
9. [ ] Test end-to-end checkout flow
10. [ ] Test webhook delivery in Stripe Dashboard

---

## 🧪 Testing Checklist

After completing above items, test:

- [ ] User can sign up
- [ ] User can run trial report
- [ ] User can click "Upgrade" button
- [ ] Stripe checkout page loads
- [ ] Payment completes successfully
- [ ] User is redirected back to app
- [ ] Subscription is activated (check Supabase `subscriptions` table)
- [ ] User can run paid reports
- [ ] Webhook events appear in Stripe Dashboard → Webhooks → Events

---

## 🚨 If Something Breaks

**Check These First**:
1. Supabase Edge Functions logs: Dashboard → Edge Functions → Logs
2. Stripe webhook logs: Dashboard → Developers → Webhooks → [Your endpoint] → Events
3. Browser console: F12 → Console tab
4. Vercel deployment logs: Dashboard → Deployments → [Latest] → Logs

**Common Issues**:
- "Failed to fetch" → Edge Function not deployed or wrong URL
- "Unauthorized" → Missing or incorrect Supabase secrets
- "Webhook signature verification failed" → Wrong `STRIPE_WEBHOOK_SECRET`
- "Price ID is required" → Missing `VITE_STRIPE_PRICE_ID` in `.env`

---

## ✅ Ready to Launch?

Complete all items marked with 🔴 and 🟡 above, then:
1. Deploy to Vercel
2. Test full user flow
3. Monitor for errors
4. Go live! 🚀

