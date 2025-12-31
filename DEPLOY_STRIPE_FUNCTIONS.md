# Deploy Stripe Functions - Step by Step Guide

## ✅ Step 1: Set Stripe Secret in Supabase

You need to set your Stripe secret key as a Supabase secret:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Click **Add Secret**
5. Add:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_live_YOUR_SECRET_KEY_HERE` (Your Stripe secret key from Stripe Dashboard)
6. Click **Save**

### Option B: Using Supabase CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

## ✅ Step 2: Your Checkout Function is Already Deployed!

Your function is live at:
```
https://rhbxbrzvefllzvefllzqfuzdwb.supabase.co/functions/v1/create-checkout-session
```

The code has been updated to work with your deployed function.

## ✅ Step 3: Deploy Webhook Function

You need to deploy the webhook handler. Here's the code to use:

### Webhook Function Code

Copy this code and deploy it as `stripe-webhook` in Supabase:

```typescript
import Stripe from "npm:stripe@12.16.0";

// Read Stripe secret and webhook secret from env
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET');
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!STRIPE_SECRET) console.warn('Warning: STRIPE_SECRET is not set');
if (!WEBHOOK_SECRET) console.warn('Warning: STRIPE_WEBHOOK_SECRET is not set');

const stripe = new Stripe(STRIPE_SECRET ?? '', { apiVersion: '2022-11-15' });

// Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No stripe-signature header' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET ?? '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        // Get subscription details
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error('No subscription ID in checkout session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;

        // Update subscription in database
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan_type: 'monthly',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            reports_limit: 10,
            reports_used: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log upgrade completed event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'upgrade_completed',
          metadata: {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            amount: session.amount_total,
          },
        });

        // Update payment intent status
        if (session.payment_intent) {
          await supabase
            .from('payment_intents')
            .update({
              status: 'succeeded',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', session.payment_intent as string);
        }

        console.log(`✅ Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', subscription.customer);
          break;
        }

        const userId = subscriptionData.user_id;

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'canceled' : 'past_due',
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log subscription updated event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_updated',
          metadata: {
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
        });

        console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', subscription.customer);
          break;
        }

        const userId = subscriptionData.user_id;

        // Update subscription status to canceled
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log subscription canceled event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_canceled',
          metadata: {
            canceled_at: new Date().toISOString(),
          },
        });

        console.log(`✅ Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single();

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', invoice.customer);
          break;
        }

        const userId = subscriptionData.user_id;

        // Update subscription status to past_due
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log payment failed event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'payment_failed',
          metadata: {
            invoice_id: invoice.id,
            amount: invoice.amount_due,
            attempt_count: invoice.attempt_count,
          },
        });

        console.log(`⚠️ Payment failed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message ?? String(err) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
```

### How to Deploy Webhook Function

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create a new function**
3. Name it: `stripe-webhook`
4. Paste the code above
5. Click **Deploy**

## ✅ Step 4: Update Checkout Function to Include User ID

Your current checkout function needs to include the user ID in metadata so the webhook can update the correct subscription. Update your function to:

```typescript
// Add this to your checkout function's params
const params: any = {
  mode,
  line_items,
  success_url,
  cancel_url,
  metadata: {
    userId: userId, // Add this - get from auth header
  },
  subscription_data: {
    metadata: {
      userId: userId, // Also add to subscription metadata
    },
  },
};
```

**OR** update the frontend to pass userId in the request body, and your function can include it in metadata.

## ✅ Step 5: Create Stripe Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: 
   ```
   https://rhbxbrzvefllzqfuzdwb.supabase.co/functions/v1/stripe-webhook
   ```
4. **Events to send**: Select:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_`)
7. **Add it to Supabase Secrets**:
   - Go to Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add secret: `STRIPE_WEBHOOK_SECRET` = `whsec_...`

## ✅ Step 6: Update Checkout Function to Pass User ID

You need to modify your checkout function to accept and use the userId. Here's the updated version:

```typescript
import Stripe from "npm:stripe@12.16.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET');
if (!STRIPE_SECRET) console.warn('Warning: STRIPE_SECRET is not set');
const stripe = new Stripe(STRIPE_SECRET ?? '', { apiVersion: '2022-11-15' });

// Supabase client for auth
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.line_items) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { line_items, mode = 'subscription', success_url, cancel_url } = body;

    if (!success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: 'success_url and cancel_url are required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const params: any = {
      mode,
      line_items,
      success_url,
      cancel_url,
      metadata: {
        userId: user.id, // Add user ID to metadata
      },
      subscription_data: {
        metadata: {
          userId: user.id, // Also add to subscription metadata
        },
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    return new Response(JSON.stringify({ url: session.url, id: session.id }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('Error creating checkout session', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message ?? String(err) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});
```

## ✅ Step 7: Test the Integration

1. **Restart your dev server** (to load new env vars):
   ```bash
   npm run dev
   ```

2. **Test checkout flow**:
   - Sign up/login
   - Click "Upgrade Now"
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Should redirect back and subscription should activate

3. **Check webhook logs**:
   - Stripe Dashboard → Webhooks → Your endpoint → Events
   - Should see events being received

4. **Check database**:
   - Supabase Dashboard → Table Editor → `subscriptions`
   - Should see subscription with `status: 'active'`

## 🔒 Security Checklist

- ✅ Stripe Secret stored in Supabase Secrets
- ✅ Webhook signature verification enabled
- ✅ User authentication required for checkout
- ✅ All sensitive operations server-side
- ✅ No payment data exposed to frontend

