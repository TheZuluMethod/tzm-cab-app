# Complete Setup Summary - Subscription Purchase Flow

## ✅ Code Status

**All code has been pushed to Git successfully!**
- ✅ No secrets committed
- ✅ All new features included
- ✅ Referral system implemented
- ✅ Account panel reorganized
- ✅ Upgrade screens updated

---

## Part A: What's Missing for Full Round-Trip Purchase

### 🔴 Critical Missing Items:

#### 1. **Supabase Edge Functions Not Deployed** ⚠️ HIGH PRIORITY
   - ❌ `create-checkout-session` function needs deployment
   - ❌ `stripe-webhook` function needs deployment
   - **Impact**: "Failed to fetch" error when clicking upgrade
   - **Location**: `supabase/functions/create-checkout-session/index.ts` and `supabase/functions/stripe-webhook/index.ts`

#### 2. **Environment Variables Missing** ⚠️ HIGH PRIORITY
   **In Supabase Edge Functions Secrets:**
   - ❌ `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_test_` or `sk_live_`)
   - ❌ `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`) - Get after webhook setup
   - ❌ `SUPABASE_URL` - Your Supabase project URL
   - ❌ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (found in Supabase Settings → API)
   - ❌ `SITE_URL` - Your site URL (optional, defaults to localhost:5173)

   **In Frontend `.env` file:**
   - ❌ `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_test_` or `pk_live_`)
   - ❌ `VITE_STRIPE_PRICE_ID` - Stripe Price ID for $99/month subscription (starts with `price_`)

#### 3. **Stripe Dashboard Configuration** ⚠️ HIGH PRIORITY
   - ❌ Stripe Product & Price need to be created ($99/month recurring)
   - ❌ Webhook endpoint needs to be configured in Stripe Dashboard
   - ❌ Webhook events need to be subscribed:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

#### 4. **Database Migrations** ⚠️ MEDIUM PRIORITY
   - ❌ `create_subscriptions_schema.sql` needs to be run
   - ❌ `create_referrals_schema.sql` needs to be run (optional, for referral system)

#### 5. **Function Parameter Mismatch** ✅ FIXED
   - ✅ Fixed: Frontend now sends `priceId` directly (matches backend expectation)

---

## Part B: Step-by-Step Setup Instructions

### 🎯 STEP 1: Create Stripe Product & Price (5 minutes)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products
2. **Toggle to Test Mode** (top right corner)
3. **Click "Add Product"**
4. **Product Details**:
   - Name: `AI Advisory Board - Monthly Subscription`
   - Description: `10 reports per month with unlimited access`
5. **Pricing**:
   - Price: `$99.00 USD`
   - Billing: `Monthly` (recurring)
   - Click **"Save product"**
6. **Copy the Price ID** (starts with `price_`) → Save this for Step 6

---

### 🎯 STEP 2: Get Stripe API Keys (2 minutes)

1. **Go to**: https://dashboard.stripe.com/apikeys
2. **Make sure Test Mode is ON**
3. **Copy**:
   - **Publishable key** (`pk_test_...`) → Save for Step 6
   - **Secret key** (`sk_test_...`) → Click "Reveal" → Save for Step 4

---

### 🎯 STEP 3: Run Database Migrations (5 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to**: SQL Editor
4. **Run Migration 1**:
   - Open: `supabase/migrations/create_subscriptions_schema.sql`
   - Copy entire file
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ Verify: Table Editor → Should see `subscriptions`, `subscription_events`, `payment_intents` tables
5. **Run Migration 2** (Optional - for referral system):
   - Open: `supabase/migrations/create_referrals_schema.sql`
   - Copy entire file
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ Verify: Table Editor → Should see `referrals` table

---

### 🎯 STEP 4: Deploy Supabase Edge Functions (15 minutes)

#### 4.1 Deploy `create-checkout-session` Function

1. **Go to**: Supabase Dashboard → Edge Functions
2. **Click**: "Create a new function"
3. **Function Name**: `create-checkout-session`
4. **Copy code from**: `supabase/functions/create-checkout-session/index.ts`
5. **Paste** into the function editor
6. **Set Secrets** (Settings → Edge Functions → Secrets):
   ```
   STRIPE_SECRET_KEY = sk_test_... (from Step 2)
   SUPABASE_URL = https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJ... (from Settings → API → service_role key)
   SITE_URL = http://localhost:5173 (or your production URL)
   ```
7. **Click**: "Deploy"

#### 4.2 Deploy `stripe-webhook` Function

1. **Create another function**: `stripe-webhook`
2. **Copy code from**: `supabase/functions/stripe-webhook/index.ts`
3. **Paste** into the function editor
4. **Set Secrets** (same as above, plus):
   ```
   STRIPE_WEBHOOK_SECRET = (Leave empty for now, add after Step 5)
   ```
5. **Click**: "Deploy"

---

### 🎯 STEP 5: Configure Stripe Webhook (10 minutes)

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Make sure Test Mode is ON**
3. **Click**: "Add endpoint"
4. **Endpoint URL**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
   - Find `YOUR_PROJECT_ID` in: Supabase Dashboard → Settings → API → Project URL
5. **Select Events**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. **Click**: "Add endpoint"
7. **Copy the Signing secret** (`whsec_...`)
8. **Add to Supabase Secrets**:
   - Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...` (the secret you just copied)
   - **Redeploy** `stripe-webhook` function (click "Deploy" again)

---

### 🎯 STEP 6: Configure Frontend Environment Variables (2 minutes)

1. **Create/Update `.env` file** in project root:
   ```env
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   VITE_STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
   
   # Supabase Configuration (should already exist)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Replace placeholders**:
   - `pk_test_YOUR_KEY_HERE` → Your publishable key from Step 2
   - `price_YOUR_PRICE_ID_HERE` → Your price ID from Step 1
   - `your-project-id` → Your Supabase project ID
   - `your-anon-key-here` → Your Supabase anon key

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

---

### 🎯 STEP 7: Test the Complete Flow (10 minutes)

#### Test 1: Create Checkout Session ✅
1. Sign in to your app
2. Click "Upgrade Now" button
3. **Expected**: Redirects to Stripe Checkout
4. **If error**: Check browser console and Supabase Edge Function logs

#### Test 2: Complete Test Purchase ✅
1. On Stripe Checkout, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
2. Click "Subscribe"
3. **Expected**: Redirects back to app with success

#### Test 3: Verify Webhook Processing ✅
1. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
2. **Should see**: `checkout.session.completed` event
3. Check Supabase → Table Editor → `subscriptions`
4. **Should see**: Subscription with `status = 'active'`

#### Test 4: Verify Frontend Updates ✅
1. After returning from Stripe, check subscription status
2. **Should show**: Active subscription with 10 reports/month
3. **Should allow**: Creating new reports

---

## 🔧 Troubleshooting Guide

### Error: "Failed to fetch"
**Cause**: Edge function not deployed or wrong URL
**Fix**: 
- Verify function is deployed: Supabase Dashboard → Edge Functions
- Check function URL matches: `/functions/v1/create-checkout-session`
- Check browser console for exact error
- Check Supabase Edge Function logs

### Error: "STRIPE_SECRET_KEY environment variable is not set"
**Cause**: Secret not set in Supabase Edge Functions
**Fix**: 
- Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
- Add `STRIPE_SECRET_KEY` with your Stripe secret key
- Redeploy the function

### Error: "No userId in checkout session metadata"
**Cause**: Checkout function not including userId (should be automatic)
**Fix**: 
- Function already includes userId (lines 86-91 in `index.ts`)
- Verify user is authenticated when calling checkout
- Check Supabase Edge Function logs

### Webhook Not Receiving Events
**Cause**: Webhook URL wrong or webhook secret not configured
**Fix**: 
- Verify webhook URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
- Check webhook secret is set in Supabase secrets
- Test webhook: Stripe Dashboard → Webhooks → Your endpoint → Send test webhook

### Subscription Not Activating After Payment
**Cause**: Webhook not processing or database error
**Fix**: 
- Check Supabase Edge Functions → Logs for `stripe-webhook` function
- Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
- Verify `subscriptions` table exists and has correct schema
- Check webhook logs for errors

---

## 📋 Pre-Flight Checklist

Before testing, verify all items are complete:

- [ ] ✅ Stripe Product & Price created ($99/month)
- [ ] ✅ Stripe API keys obtained (test mode)
- [ ] ✅ Database migrations run (`create_subscriptions_schema.sql`)
- [ ] ✅ `create-checkout-session` function deployed
- [ ] ✅ `stripe-webhook` function deployed
- [ ] ✅ All Edge Function secrets set:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SITE_URL` (optional)
- [ ] ✅ Stripe webhook endpoint created and configured
- [ ] ✅ Frontend `.env` file configured:
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] `VITE_STRIPE_PRICE_ID`
- [ ] ✅ Dev server restarted after `.env` changes

---

## 🎯 Quick Reference

### Key Files:
- **Checkout Function**: `supabase/functions/create-checkout-session/index.ts`
- **Webhook Function**: `supabase/functions/stripe-webhook/index.ts`
- **Frontend Service**: `services/stripeService.ts`
- **Database Schema**: `supabase/migrations/create_subscriptions_schema.sql`

### Key URLs:
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Test Cards**: https://stripe.com/docs/testing

### Test Card:
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

---

## ✅ Success Criteria

You'll know everything is working when:
1. ✅ Clicking "Upgrade Now" redirects to Stripe Checkout (no "Failed to fetch" error)
2. ✅ Completing checkout redirects back to app
3. ✅ Subscription status shows as "active" in database
4. ✅ User can create reports (up to 10/month)
5. ✅ Webhook events appear in Stripe Dashboard
6. ✅ No errors in browser console or Supabase logs

---

## 📚 Additional Documentation

- **Complete Setup Guide**: `STRIPE_SUBSCRIPTION_COMPLETE_SETUP.md`
- **Subscription System**: `SUBSCRIPTION_SYSTEM_SETUP.md`
- **Referral System**: `REFERRAL_SYSTEM_SETUP.md`
- **Deploy Functions**: `DEPLOY_STRIPE_FUNCTIONS.md`

---

## 🚀 Next Steps After Setup

1. Test full purchase flow end-to-end
2. Set up email notifications for subscription events
3. Configure subscription cancellation flow
4. Set up subscription renewal reminders
5. Test referral credit application (if using referral system)
6. Switch to Live Mode keys when ready for production

