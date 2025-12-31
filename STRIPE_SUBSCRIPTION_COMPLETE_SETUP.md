# Complete Stripe Subscription Setup Guide

## Overview
This guide provides a complete step-by-step process to set up the full subscription purchase flow from frontend to backend, including Stripe integration, webhooks, and database updates.

---

## Part A: What's Missing for Full Round-Trip Purchase

### ✅ Already Implemented:
1. ✅ Frontend upgrade UI (TrialNagModal, UpgradeScreen)
2. ✅ Stripe service client (`stripeService.ts`)
3. ✅ Checkout session creation function
4. ✅ Webhook handler function (code exists)
5. ✅ Database schema for subscriptions
6. ✅ Subscription status checking
7. ✅ Checkout success handler

### ❌ Missing/Needs Configuration:

#### 1. **Supabase Edge Functions Not Deployed**
   - `create-checkout-session` function needs to be deployed
   - `stripe-webhook` function needs to be deployed

#### 2. **Environment Variables Missing**
   - `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
   - `VITE_STRIPE_PRICE_ID` - Stripe Price ID for $99/month subscription (starts with `price_`)

#### 3. **Stripe Dashboard Configuration**
   - Stripe Product and Price need to be created
   - Webhook endpoint needs to be configured in Stripe Dashboard
   - Webhook events need to be subscribed

#### 4. **Database Migrations**
   - `create_subscriptions_schema.sql` needs to be run
   - `create_referrals_schema.sql` needs to be run (for referral system)

#### 5. **Metadata Passing**
   - Checkout session needs to include `userId` in metadata
   - Webhook needs to extract `userId` from metadata

---

## Part B: Step-by-Step Setup Instructions

### STEP 1: Create Stripe Product and Price

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/products
2. **Click "Add Product"**
3. **Fill in Product Details**:
   - Name: `AI Advisory Board - Monthly Subscription`
   - Description: `10 reports per month with unlimited access`
4. **Set Pricing**:
   - Pricing model: `Standard pricing`
   - Price: `$99.00 USD`
   - Billing period: `Monthly`
   - Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - You'll need this for `VITE_STRIPE_PRICE_ID`

---

### STEP 2: Get Stripe API Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/apikeys
2. **Copy the following**:
   - **Publishable key** (starts with `pk_`) - This is your `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_`) - Click "Reveal" to see it - This is your `STRIPE_SECRET_KEY`
   - ⚠️ **IMPORTANT**: Use **Test mode** keys for development, **Live mode** for production

---

### STEP 3: Set Up Supabase Edge Functions

#### 3.1 Deploy `create-checkout-session` Function

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Edge Functions → Create Function
3. **Function Name**: `create-checkout-session`
4. **Copy the code from**: `supabase/functions/create-checkout-session/index.ts`
5. **Set Function Secrets** (Settings → Edge Functions → Secrets):
   - `STRIPE_SECRET_KEY` = Your Stripe secret key (from Step 2)
6. **Deploy the function**

#### 3.2 Deploy `stripe-webhook` Function

1. **Create another Edge Function**: `stripe-webhook`
2. **Copy the code from**: `supabase/functions/stripe-webhook/index.ts`
3. **Set Function Secrets**:
   - `STRIPE_SECRET_KEY` = Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = (You'll get this after Step 4)
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
4. **Deploy the function**

---

### STEP 4: Configure Stripe Webhook

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: 
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
   Replace `YOUR_SUPABASE_PROJECT_ID` with your actual Supabase project ID (found in Supabase Dashboard → Settings → API)
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the Signing secret** (starts with `whsec_`)
7. **Add to Supabase Secrets**:
   - Go to Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add: `STRIPE_WEBHOOK_SECRET` = The signing secret you just copied

---

### STEP 5: Run Database Migrations

1. **Go to Supabase Dashboard**: SQL Editor
2. **Run these migrations in order**:

   **a) Subscriptions Schema**:
   ```sql
   -- Run: supabase/migrations/create_subscriptions_schema.sql
   ```

   **b) Referrals Schema** (optional, for referral system):
   ```sql
   -- Run: supabase/migrations/create_referrals_schema.sql
   ```

3. **Verify tables created**:
   - Check that `subscriptions` table exists
   - Check that `subscription_events` table exists
   - Check that `referrals` table exists (if you ran referrals migration)

---

### STEP 6: Configure Frontend Environment Variables

1. **Create/Update `.env` file** in project root:
   ```env
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (your publishable key)
   VITE_STRIPE_PRICE_ID=price_... (your price ID from Step 1)
   
   # Supabase Configuration (should already exist)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Restart your dev server**:
   ```bash
   npm run dev
   ```

---

### STEP 7: Update Checkout Function to Include User ID

**File**: `supabase/functions/create-checkout-session/index.ts`

**Ensure the function includes userId in metadata**:

```typescript
// The function should extract userId from the auth token
const authHeader = req.headers.get('Authorization');
// Parse JWT to get userId, or get from request body

// When creating checkout session, include:
metadata: {
  userId: userId,
},
subscription_data: {
  metadata: {
    userId: userId,
  },
},
```

---

### STEP 8: Test the Flow

#### Test 1: Create Checkout Session
1. Click "Upgrade Now" button
2. Should redirect to Stripe Checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout

#### Test 2: Verify Webhook Processing
1. After checkout, check Stripe Dashboard → Webhooks → Your endpoint
2. Should see `checkout.session.completed` event received
3. Check Supabase Dashboard → Table Editor → `subscriptions`
4. Should see subscription status = `active`

#### Test 3: Verify Frontend Updates
1. After returning from Stripe, check subscription status
2. Should show active subscription
3. Should allow creating reports

---

## Troubleshooting

### "Failed to fetch" Error
- **Cause**: Edge function not deployed or wrong URL
- **Fix**: Verify function is deployed and URL is correct in `stripeService.ts`

### Webhook Not Receiving Events
- **Cause**: Webhook secret not configured or endpoint URL wrong
- **Fix**: Verify webhook endpoint URL in Stripe matches Supabase function URL

### Subscription Not Activating
- **Cause**: Webhook not processing or userId not in metadata
- **Fix**: Check webhook logs in Supabase Dashboard → Edge Functions → Logs

### User ID Missing in Metadata
- **Cause**: Checkout function not including userId
- **Fix**: Update `create-checkout-session` function to extract userId from auth token

---

## Security Checklist

- ✅ Never commit `.env` files
- ✅ Never commit Stripe secret keys
- ✅ Use environment variables for all secrets
- ✅ Webhook signature verification enabled
- ✅ User authentication required for checkout
- ✅ RLS policies enabled on subscriptions table

---

## Next Steps After Setup

1. Test full purchase flow end-to-end
2. Set up email notifications for subscription events
3. Configure subscription cancellation flow
4. Set up subscription renewal reminders
5. Test referral credit application (if using referral system)

