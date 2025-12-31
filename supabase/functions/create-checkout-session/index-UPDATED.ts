/**
 * UPDATED VERSION - Includes user authentication and metadata
 * 
 * Replace your current function with this version to include userId in metadata
 */

import Stripe from "npm:stripe@12.16.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Read Stripe secret from env
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

    // Get user email for Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();
    
    const userEmail = userData?.email || user.email;

    const params: any = {
      mode,
      line_items,
      success_url,
      cancel_url,
      customer_email: userEmail,
      metadata: {
        userId: user.id, // CRITICAL: Add user ID to metadata for webhook
      },
      subscription_data: {
        metadata: {
          userId: user.id, // Also add to subscription metadata
        },
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    // Log payment intent creation
    await supabase.from('payment_intents').insert({
      user_id: user.id,
      stripe_payment_intent_id: session.payment_intent as string || session.id,
      stripe_checkout_session_id: session.id,
      amount: 9900, // $99.00 in cents
      currency: 'usd',
      status: 'pending',
    });

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

