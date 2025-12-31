/**
 * UPDATED VERSION - Matches your code style
 * 
 * Deploy this as stripe-webhook in Supabase
 */

import Stripe from "npm:stripe@12.16.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Read Stripe secret and webhook secret from env
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET');
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!STRIPE_SECRET) console.warn('Warning: STRIPE_SECRET is not set');
if (!WEBHOOK_SECRET) console.warn('Warning: STRIPE_WEBHOOK_SECRET is not set');

const stripe = new Stripe(STRIPE_SECRET ?? '', { apiVersion: '2022-11-15' });

// Supabase client
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
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
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

        if (updateError) {
          console.error('Error updating subscription:', updateError);
        }

        // Log subscription activated event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_activated',
          event_data: {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            checkout_session_id: session.id,
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
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Log subscription updated event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_updated',
          event_data: {
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
          event_data: {
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
          event_data: {
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

