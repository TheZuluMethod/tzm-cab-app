# Stripe Integration Setup - Complete Guide

## 🔐 Security Notice

**CRITICAL**: Your Stripe Secret Key (`sk_live_...`) is a LIVE production key. Never expose it to the frontend or commit it to git. It's now securely stored in Supabase Edge Functions environment variables.

## ✅ What's Been Created

1. **Supabase Edge Function: `create-checkout-session`** - Securely creates Stripe checkout sessions
2. **Supabase Edge Function: `stripe-webhook`** - Handles Stripe webhook events securely
3. **Updated `stripeService.ts`** - Calls Edge Functions instead of exposing secret key
4. **Environment variables configured** - Ready for deployment

## 🚀 Setup Steps

### Step 1: Get Your Stripe Price ID

You provided the Product ID (`prod_TgSWXxxkLDyRod`), but Stripe Checkout needs a **Price ID**. 

**To get your Price ID:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click on your product "Monthly Subscription" (or the product with ID `prod_TgSWXxxkLDyRod`)
3. You'll see a price listed - copy the **Price ID** (starts with `price_`)
4. It should look like: `price_1Sj52J31TlaqJv33...` or similar

**Add this to your `.env` file:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=mk_1Sj52O31TlaqJv33kGAszWbI
VITE_STRIPE_PRICE_ID=price_1Sj5bw3ymWngvBKidFo1ltEC
```

### Step 2: Set Up Supabase Edge Functions Environment Variables

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add these secrets:

```
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX  # You'll get this after creating webhook endpoint
SITE_URL=https://your-domain.com  # Your production URL (or http://localhost:5173 for dev)
```

**Note**: You'll get the `STRIPE_WEBHOOK_SECRET` after creating the webhook endpoint in Step 4.

### Step 3: Deploy Supabase Edge Functions

You have two options:

#### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Get your project ref from Supabase Dashboard → Settings → General → Reference ID)

4. **Deploy the functions**:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

#### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Create a new function**
3. Name it `create-checkout-session`
4. Copy the contents of `supabase/functions/create-checkout-session/index.ts`
5. Paste into the function editor
6. Click **Deploy**
7. Repeat for `stripe-webhook`

### Step 4: Create Stripe Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: 
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
   (Replace `your-project-ref` with your actual Supabase project reference ID)
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_`)
7. **Add it to Supabase Secrets** (Step 2 above)

### Step 5: Update Environment Variables in Your App

Create or update your `.env` file in the project root:

```env
# Supabase (you should already have these)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (add these)
VITE_STRIPE_PUBLISHABLE_KEY=mk_1Sj52O31TlaqJv33kGAszWbI
VITE_STRIPE_PRICE_ID=price_XXXXXXXXXXXXX  # Get from Stripe Dashboard
```

### Step 6: Test the Integration

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Test the flow**:
   - Sign up/login to your app
   - Click "Upgrade Now" or try to run a report after using your trial
   - You should be redirected to Stripe Checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the checkout
   - You should be redirected back to your app
   - Your subscription should be activated

3. **Check webhook logs**:
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - View the event logs to see if webhooks are being received

## 🔍 Troubleshooting

### Issue: "Stripe publishable key not configured"
- **Solution**: Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is in your `.env` file

### Issue: "Failed to create checkout session"
- **Solution**: 
  - Check that Edge Functions are deployed
  - Verify `STRIPE_SECRET_KEY` is set in Supabase Secrets
  - Check Edge Function logs in Supabase Dashboard

### Issue: Webhooks not working
- **Solution**:
  - Verify webhook URL is correct
  - Check `STRIPE_WEBHOOK_SECRET` is set in Supabase Secrets
  - Verify webhook endpoint is receiving events in Stripe Dashboard
  - Check Edge Function logs for errors

### Issue: "Price ID is required"
- **Solution**: Make sure `VITE_STRIPE_PRICE_ID` is set in your `.env` file

## 📊 Monitoring

### Check Subscription Status
- Go to Supabase Dashboard → Table Editor → `subscriptions` table
- You should see subscription records with status `active` after successful payment

### Check Webhook Events
- Go to Stripe Dashboard → Webhooks → Your endpoint → Events
- You should see events being received and processed

### Check Payment Intents
- Go to Supabase Dashboard → Table Editor → `payment_intents` table
- You should see payment records with status `succeeded` after successful payment

## 🔒 Security Checklist

- ✅ Stripe Secret Key stored in Supabase Secrets (not in code)
- ✅ Webhook signature verification enabled
- ✅ User authentication required for checkout session creation
- ✅ All sensitive operations happen server-side
- ✅ No payment data exposed to frontend

## 📝 Next Steps

1. Get your Price ID from Stripe Dashboard
2. Deploy Edge Functions
3. Create webhook endpoint
4. Test the full flow
5. Monitor webhook events
6. Add subscription analytics to dashboard (see `SUBSCRIPTION_SYSTEM_SETUP.md`)

## 🆘 Need Help?

If you encounter issues:
1. Check Edge Function logs in Supabase Dashboard
2. Check Stripe webhook logs
3. Verify all environment variables are set correctly
4. Ensure database migration has been run (`create_subscriptions_schema.sql`)

