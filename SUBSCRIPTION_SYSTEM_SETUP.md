# Subscription & Trial System Setup Guide

## Overview

This document outlines the complete subscription and trial system implementation for The Zulu Method CAB App.

## 🗄️ Database Setup

### 1. Run Migration

Execute the following SQL file in your Supabase SQL Editor:
```
supabase/migrations/create_subscriptions_schema.sql
```

This creates:
- `subscriptions` table - tracks user subscriptions and trial status
- `subscription_events` table - tracks conversion events for analytics
- `payment_intents` table - tracks checkout attempts and payments
- Automatic trial creation trigger on user signup

## 🔑 Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=mk_1Sj52O31TlaqJv33kGAszWbI  # Your Stripe publishable key
VITE_STRIPE_PRICE_ID=price_1Sj5bw3ymWngvBKidFo1ltEC  # Your monthly subscription price ID ($99/month)
```

**IMPORTANT**: 
- The Stripe Secret Key is stored securely in Supabase Edge Functions (never in `.env`)
- You need to get your Price ID from Stripe Dashboard (see `STRIPE_SETUP_COMPLETE.md`)

## 💳 Stripe Setup

### 1. Create Stripe Account
1. Sign up at https://stripe.com
2. Complete business verification
3. Connect your business bank account

### 2. Create Product & Price
1. Go to Products → Add Product
2. Name: "Monthly Subscription"
3. Price: $99/month
4. Billing: Recurring monthly
5. Copy the Price ID (starts with `price_`)

### 3. Get API Keys
1. Go to Developers → API Keys
2. Copy Publishable Key (starts with `pk_`)
3. Copy Secret Key (starts with `sk_`) - **Keep this secret!**

### 4. Create Webhook Endpoint (Backend Required)
You'll need a backend endpoint to handle Stripe webhooks. This can be:
- Supabase Edge Function
- Vercel Serverless Function
- Express.js API endpoint

Webhook events to handle:
- `checkout.session.completed` - User completed payment
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_failed` - Payment failed

## 🔧 Backend API Endpoint

You need to create a backend endpoint for creating Stripe Checkout sessions. This is required for security (to keep your Stripe secret key secret).

### Option 1: Supabase Edge Function

Create `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { userId, priceId } = await req.json()
    
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail, // Get from user record
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('SITE_URL')}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL')}/?canceled=true`,
      metadata: {
        userId,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Option 2: Express.js Endpoint

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { userId, priceId } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.SITE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/?canceled=true`,
    metadata: {
      userId,
    },
  });

  res.json({ sessionId: session.id });
});
```

## 📊 Features Implemented

### ✅ Trial System
- Automatic trial creation on user signup
- 1 free report per trial
- 30-day trial period
- Trial status tracking

### ✅ Subscription Management
- Monthly subscription ($99/month)
- 10 reports per month for subscribers
- Subscription status tracking
- Automatic report limit enforcement

### ✅ Upgrade Flow
- Upgrade screen with compelling messaging
- Stripe Checkout integration
- Payment processing
- Subscription activation

### ✅ Analytics
- Trial start/completion tracking
- Upgrade conversion tracking
- Checkout abandonment tracking
- MRR calculation
- Churn tracking
- Payment failure tracking

## 🚀 Next Steps

1. **Run Database Migration**: Execute `create_subscriptions_schema.sql`
2. **Set Environment Variables**: Add Stripe keys to `.env`
3. **Create Backend Endpoint**: Set up Stripe Checkout session creation endpoint
4. **Test Trial Flow**: Sign up and verify trial creation
5. **Test Upgrade Flow**: Complete a checkout and verify subscription activation
6. **Set Up Webhooks**: Configure Stripe webhooks to handle payment events

## 📝 Files Created

- `services/subscriptionService.ts` - Subscription management logic
- `services/stripeService.ts` - Stripe integration
- `components/UpgradeScreen.tsx` - Upgrade UI component
- `supabase/migrations/create_subscriptions_schema.sql` - Database schema

## 🔍 Testing Checklist

- [ ] User signup creates trial subscription
- [ ] Trial users can run 1 report
- [ ] Trial users see upgrade screen after using report
- [ ] Upgrade button opens Stripe Checkout
- [ ] Successful payment activates subscription
- [ ] Subscribers can run 10 reports/month
- [ ] Subscription analytics display correctly
- [ ] Payment webhooks update subscription status

