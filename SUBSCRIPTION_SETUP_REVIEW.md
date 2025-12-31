# Complete Subscription Purchase Flow - Setup Review

## ✅ Code Pushed to Git
All new code has been committed and pushed to the repository. No secrets were included.

---

## Part A: What's Missing for Full Round-Trip Purchase

### 🔴 Critical Missing Items:

#### 1. **Supabase Edge Functions Not Deployed**
   - ❌ `create-checkout-session` function needs deployment
   - ❌ `stripe-webhook` function needs deployment
   - **Impact**: "Failed to fetch" error when clicking upgrade

#### 2. **Environment Variables Missing**
   - ❌ `STRIPE_SECRET_KEY` - Must be set in Supabase Edge Functions secrets
   - ❌ `STRIPE_WEBHOOK_SECRET` - Must be set after webhook creation
   - ❌ `VITE_STRIPE_PUBLISHABLE_KEY` - Must be in `.env` file
   - ❌ `VITE_STRIPE_PRICE_ID` - Must be in `.env` file
   - ❌ `SUPABASE_SERVICE_ROLE_KEY` - Must be set in Edge Functions secrets
   - ❌ `SITE_URL` - Should be set in Edge Functions secrets (optional)

#### 3. **Stripe Dashboard Configuration**
   - ❌ Stripe Product & Price need to be created ($99/month)
   - ❌ Webhook endpoint needs to be configured
   - ❌ Webhook events need to be subscribed

#### 4. **Database Migrations**
   - ❌ `create_subscriptions_schema.sql` needs to be run
   - ❌ `create_referrals_schema.sql` needs to be run (optional, for referral system)

#### 5. **Function Parameter Mismatch** (FIXED)
   - ✅ Fixed: Frontend now sends `priceId` directly (matches backend expectation)

---

## Part B: Step-by-Step Setup Instructions

### 🎯 STEP 1: Create Stripe Product & Price

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products
2. **Make sure you're in Test Mode** (toggle in top right)
3. **Click "Add Product"**
4. **Fill in Product Details**:
   - Name: `AI Advisory Board - Monthly Subscription`
   - Description: `10 reports per month with unlimited access`
5. **Set Pricing**:
   - Pricing model: `Standard pricing`
   - Price: `$99.00 USD`
   - Billing period: `Monthly` (recurring)
   - Click **"Save product"**
6. **Copy the Price ID** (starts with `price_`) - You'll need this!

---

### 🎯 STEP 2: Get Stripe API Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/apikeys
2. **Make sure you're in Test Mode** (for development)
3. **Copy the following**:
   - **Publishable key** (starts with `pk_test_`) → This is `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_`) → Click "Reveal" → This is `STRIPE_SECRET_KEY`
   - ⚠️ **IMPORTANT**: Use **Test mode** keys for development!

---

### 🎯 STEP 3: Run Database Migrations

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to**: SQL Editor
4. **Run these migrations in order**:

   **a) Subscriptions Schema**:
   - Open: `supabase/migrations/create_subscriptions_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check Table Editor → Should see `subscriptions`, `subscription_events`, `payment_intents` tables

   **b) Referrals Schema** (optional):
   - Open: `supabase/migrations/create_referrals_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check Table Editor → Should see `referrals` table

---

### 🎯 STEP 4: Deploy Supabase Edge Functions

#### 4.1 Deploy `create-checkout-session` Function

1. **Go to Supabase Dashboard**: Edge Functions
2. **Click "Create a new function"**
3. **Function Name**: `create-checkout-session`
4. **Copy code from**: `supabase/functions/create-checkout-session/index.ts`
5. **Paste into function editor**
6. **Set Function Secrets**:
   - Go to: Settings → Edge Functions → Secrets
   - Add these secrets:
     - `STRIPE_SECRET_KEY` = Your Stripe secret key (from Step 2)
     - `SUPABASE_URL` = Your Supabase project URL (found in Settings → API)
     - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (found in Settings → API, under "service_role" - keep this secret!)
     - `SITE_URL` = `http://localhost:5173` (for dev) or your production URL
7. **Click "Deploy"**

#### 4.2 Deploy `stripe-webhook` Function

1. **Create another Edge Function**: `stripe-webhook`
2. **Copy code from**: `supabase/functions/stripe-webhook/index.ts`
3. **Paste into function editor**
4. **Set Function Secrets** (same as above, plus):
   - `STRIPE_WEBHOOK_SECRET` = (You'll get this in Step 5 - leave empty for now, add after)
5. **Click "Deploy"**

---

### 🎯 STEP 5: Configure Stripe Webhook

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Make sure you're in Test Mode**
3. **Click "Add endpoint"**
4. **Endpoint URL**: 
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
   - Replace `YOUR_PROJECT_ID` with your Supabase project ID
   - Find it in: Supabase Dashboard → Settings → API → Project URL (the part before `.supabase.co`)
5. **Events to send**: Click "Select events" and choose:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. **Click "Add endpoint"**
7. **Copy the Signing secret** (starts with `whsec_`)
8. **Add to Supabase Secrets**:
   - Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add: `STRIPE_WEBHOOK_SECRET` = The signing secret you just copied
   - **Redeploy** the `stripe-webhook` function (click "Deploy" again)

---

### 🎯 STEP 6: Configure Frontend Environment Variables

1. **Create/Update `.env` file** in project root:
   ```env
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   VITE_STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
   
   # Supabase Configuration (should already exist)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Replace placeholders**:
   - `pk_test_YOUR_PUBLISHABLE_KEY_HERE` → Your actual publishable key from Step 2
   - `price_YOUR_PRICE_ID_HERE` → Your actual price ID from Step 1
   - `your-project-id` → Your Supabase project ID
   - `your-anon-key-here` → Your Supabase anon key

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

---

### 🎯 STEP 7: Test the Flow

#### Test 1: Create Checkout Session
1. **Sign in** to your app
2. **Click "Upgrade Now"** button (on trial nag screen or upgrade screen)
3. **Expected**: Should redirect to Stripe Checkout page
4. **If error**: Check browser console and Supabase Edge Function logs

#### Test 2: Complete Test Purchase
1. **On Stripe Checkout page**, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
2. **Click "Subscribe"**
3. **Expected**: Should redirect back to your app with success message

#### Test 3: Verify Webhook Processing
1. **Check Stripe Dashboard**: Webhooks → Your endpoint → Recent events
2. **Should see**: `checkout.session.completed` event received
3. **Check Supabase Dashboard**: Table Editor → `subscriptions`
4. **Should see**: Subscription with `status = 'active'` for your user

#### Test 4: Verify Frontend Updates
1. **After returning from Stripe**, check subscription status
2. **Should show**: Active subscription with 10 reports/month
3. **Should allow**: Creating new reports

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"
**Cause**: Edge function not deployed or wrong URL
**Fix**: 
- Verify function is deployed in Supabase Dashboard
- Check function URL matches `stripeService.ts` (should be `/functions/v1/create-checkout-session`)
- Check browser console for exact error

### Error: "STRIPE_SECRET_KEY environment variable is not set"
**Cause**: Secret not set in Supabase Edge Functions
**Fix**: 
- Go to Supabase Dashboard → Settings → Edge Functions → Secrets
- Add `STRIPE_SECRET_KEY` with your Stripe secret key
- Redeploy the function

### Error: "No userId in checkout session metadata"
**Cause**: Checkout function not including userId
**Fix**: 
- The function already includes userId (line 86-91 in `index.ts`)
- Verify user is authenticated when calling checkout

### Webhook Not Receiving Events
**Cause**: Webhook URL wrong or webhook secret not configured
**Fix**: 
- Verify webhook URL in Stripe matches: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
- Check webhook secret is set in Supabase secrets
- Test webhook in Stripe Dashboard → Send test webhook

### Subscription Not Activating After Payment
**Cause**: Webhook not processing or database error
**Fix**: 
- Check Supabase Edge Functions → Logs for `stripe-webhook` function
- Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
- Verify `subscriptions` table exists and has correct schema

---

## 📋 Pre-Flight Checklist

Before testing, verify:

- [ ] Stripe Product & Price created ($99/month)
- [ ] Stripe API keys obtained (test mode)
- [ ] Database migrations run (`create_subscriptions_schema.sql`)
- [ ] `create-checkout-session` function deployed
- [ ] `stripe-webhook` function deployed
- [ ] All Edge Function secrets set:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SITE_URL` (optional)
- [ ] Stripe webhook endpoint created and configured
- [ ] Frontend `.env` file configured:
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] `VITE_STRIPE_PRICE_ID`
- [ ] Dev server restarted after `.env` changes

---

## 🎯 Quick Start Commands

```bash
# 1. Set up environment variables
# Edit .env file with your keys

# 2. Restart dev server
npm run dev

# 3. Test checkout flow
# Click "Upgrade Now" → Complete Stripe checkout → Verify subscription activates
```

---

## 📚 Additional Resources

- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Supabase Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
- **Complete Setup Guide**: See `STRIPE_SUBSCRIPTION_COMPLETE_SETUP.md`

---

## ✅ Success Criteria

You'll know everything is working when:
1. ✅ Clicking "Upgrade Now" redirects to Stripe Checkout
2. ✅ Completing checkout redirects back to app
3. ✅ Subscription status shows as "active" in database
4. ✅ User can create reports (up to 10/month)
5. ✅ Webhook events appear in Stripe Dashboard
6. ✅ No errors in browser console or Supabase logs

