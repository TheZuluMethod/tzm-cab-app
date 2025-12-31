/**
 * Supabase Edge Function: Stripe Webhook Handler
 * 
 * SECURITY: This function verifies webhook signatures from Stripe to ensure
 * requests are authentic and haven't been tampered with.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Stripe secret key and webhook secret from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the raw body and signature header
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      throw new Error('No stripe-signature header')
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get user ID from metadata
        const userId = session.metadata?.userId || session.subscription_data?.metadata?.userId
        
        if (!userId) {
          console.error('No userId in checkout session metadata')
          break
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.error('No subscription ID in checkout session')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id

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
            reports_used: 0, // Reset counter
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // Log upgrade completed event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'upgrade_completed',
          metadata: {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            amount: session.amount_total,
          },
        })

        // Update payment intent status
        if (session.payment_intent) {
          await supabase
            .from('payment_intents')
            .update({
              status: 'succeeded',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', session.payment_intent as string)
        }

        console.log(`✅ Subscription activated for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', subscription.customer)
          break
        }

        const userId = subscriptionData.user_id

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
          .eq('user_id', userId)

        // Log subscription updated event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_updated',
          metadata: {
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
        })

        console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', subscription.customer)
          break
        }

        const userId = subscriptionData.user_id

        // Update subscription status to canceled
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // Log subscription canceled event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscription_canceled',
          metadata: {
            canceled_at: new Date().toISOString(),
          },
        })

        console.log(`✅ Subscription canceled for user ${userId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Find user by customer ID
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (!subscriptionData) {
          console.error('Subscription not found for customer:', invoice.customer)
          break
        }

        const userId = subscriptionData.user_id

        // Update subscription status to past_due
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // Log payment failed event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'payment_failed',
          metadata: {
            invoice_id: invoice.id,
            amount: invoice.amount_due,
            attempt_count: invoice.attempt_count,
          },
        })

        console.log(`⚠️ Payment failed for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

