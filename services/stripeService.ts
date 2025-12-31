/**
 * Stripe Payment Integration Service
 * Handles payment processing via Stripe Checkout
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';
import { logSubscriptionEvent } from './subscriptionService';

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] || '';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialize Stripe
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not configured');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }

  return stripePromise;
};

/**
 * Create Stripe Checkout Session
 * This should be called from a backend API endpoint for security
 * For now, we'll create a Supabase Edge Function endpoint reference
 */
export const createCheckoutSession = async (userId: string): Promise<{ sessionId: string | null; error: string | null }> => {
  try {
    // Enhanced logging for debugging
    if (import.meta.env.DEV) {
      console.log('🔍 [Stripe] Starting checkout session creation...', { userId });
    }

    // Log checkout started event
    await logSubscriptionEvent(userId, null, 'checkout_started', {});

    // Call Supabase Edge Function (secure backend endpoint)
    const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || '';
    if (!supabaseUrl) {
      const error = 'Supabase URL not configured';
      console.error('❌ [Stripe]', error);
      throw new Error(error);
    }

    if (import.meta.env.DEV) {
      console.log('✅ [Stripe] Supabase URL:', supabaseUrl);
    }

    // Get current session for authentication
    if (!supabase) {
      const error = 'Supabase client not initialized';
      console.error('❌ [Stripe]', error);
      throw new Error(error);
    }

    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    if (!authSession || sessionError) {
      const error = 'User not authenticated';
      console.error('❌ [Stripe]', error, sessionError);
      throw new Error(error);
    }

    if (import.meta.env.DEV) {
      console.log('✅ [Stripe] User authenticated:', { userId: authSession.user.id });
    }

    // Get Price ID from environment
    const priceId = import.meta.env['VITE_STRIPE_PRICE_ID'] || '';
    if (!priceId) {
      const error = 'Stripe Price ID not configured. Please set VITE_STRIPE_PRICE_ID in your .env file.';
      console.error('❌ [Stripe]', error);
      return { sessionId: null, error };
    }

    if (import.meta.env.DEV) {
      console.log('✅ [Stripe] Price ID:', priceId);
    }

    // Build the Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
    const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || '';

    if (import.meta.env.DEV) {
      console.log('🔗 [Stripe] Calling Edge Function:', edgeFunctionUrl);
      console.log('📦 [Stripe] Request payload:', { priceId });
    }

    // Call Edge Function with the expected format
    let response: Response;
    try {
      response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          priceId: priceId, // Send priceId directly as the function expects it
        }),
      });
    } catch (fetchError: any) {
      // Network error (Failed to fetch)
      console.error('❌ [Stripe] Network error calling Edge Function:', fetchError);
      console.error('❌ [Stripe] Error details:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
        url: edgeFunctionUrl,
      });
      return { 
        sessionId: null, 
        error: `Network error: ${fetchError.message}. Please check: 1) Edge Function is deployed, 2) URL is correct (${edgeFunctionUrl}), 3) No CORS issues.` 
      };
    }

    if (import.meta.env.DEV) {
      console.log('📡 [Stripe] Response status:', response.status, response.statusText);
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
        if (errorJson.details) {
          errorMessage += `: ${errorJson.details}`;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error('❌ [Stripe] Edge Function error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      });
      return { sessionId: null, error: `[${response.status}] ${errorMessage}` };
    }

    const responseData = await response.json();
    // Edge Function returns { sessionId: "cs_..." }, not { id: ... }
    const sessionId = responseData.sessionId || responseData.id;
    const url = responseData.url;
    const responseError = responseData.error;

    if (import.meta.env.DEV) {
      console.log('✅ [Stripe] Response data:', responseData);
    }

    if (responseError) {
      console.error('❌ [Stripe] Response contains error:', responseError);
      return { sessionId: null, error: responseError };
    }
    
    if (!sessionId) {
      const error = 'No session ID returned from server';
      console.error('❌ [Stripe]', error, 'Response:', responseData);
      return { sessionId: null, error };
    }
    
    // Store the checkout URL if needed (for redirect)
    if (url) {
      // The function returns a URL, but we'll use redirectToCheckout which needs sessionId
      // Store URL in sessionStorage as fallback
      sessionStorage.setItem('stripe_checkout_url', url);
    }

    if (import.meta.env.DEV) {
      console.log('✅ [Stripe] Checkout session created successfully:', { sessionId });
    }
    
    return { sessionId, error: null };
  } catch (error: any) {
    console.error('❌ [Stripe] Unexpected error creating checkout session:', error);
    console.error('❌ [Stripe] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return { sessionId: null, error: error.message || 'Failed to create checkout session' };
  }
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (userId: string): Promise<void> => {
  const { sessionId, error } = await createCheckoutSession(userId);

  if (error || !sessionId) {
    throw new Error(error || 'Failed to create checkout session');
  }

  // Check if we have a direct URL from the function (fallback)
  const checkoutUrl = sessionStorage.getItem('stripe_checkout_url');
  if (checkoutUrl) {
    sessionStorage.removeItem('stripe_checkout_url');
    window.location.href = checkoutUrl;
    return;
  }

  // Otherwise use Stripe.js redirect
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  // Use Stripe.js redirectToCheckout method (type assertion needed for TypeScript)
  const redirectResult = await (stripe as any).redirectToCheckout({
    sessionId,
  });

  if (redirectResult?.error) {
    throw redirectResult.error;
  }
};

/**
 * Log payment intent creation (for analytics)
 */
export const logPaymentIntent = async (
  userId: string,
  stripePaymentIntentId: string,
  stripeCheckoutSessionId: string,
  amount: number
): Promise<void> => {
  if (!supabase) return;

  try {
    await supabase.from('payment_intents').insert({
      user_id: userId,
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      amount,
      currency: 'usd',
      status: 'pending',
    });
  } catch (error) {
    console.error('Error logging payment intent:', error);
  }
};

/**
 * Update payment intent status
 */
export const updatePaymentIntentStatus = async (
  stripePaymentIntentId: string,
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'abandoned'
): Promise<void> => {
  if (!supabase) return;

  try {
    await supabase
      .from('payment_intents')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', stripePaymentIntentId);
  } catch (error) {
    console.error('Error updating payment intent status:', error);
  }
};

