/**
 * Handle Stripe Checkout Success
 * Processes the checkout session after user returns from Stripe
 */

import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';
import { getSubscriptionStatus } from './subscriptionService';

/**
 * Check for successful checkout session in URL and process it
 */
export const handleCheckoutSuccess = async (): Promise<{ success: boolean; message?: string }> => {
  // Check for session_id in URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const success = urlParams.get('success');
  const canceled = urlParams.get('canceled');

  if (canceled === 'true') {
    // User canceled checkout
    return { success: false, message: 'Checkout was canceled' };
  }

  if (!sessionId || success !== 'true') {
    // No checkout session to process
    return { success: false };
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Refresh subscription status (webhook should have updated it)
    // Give webhook a moment to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const subscriptionStatus = await getSubscriptionStatus(user.id);
    
    if (subscriptionStatus.isActive && subscriptionStatus.plan_type === 'monthly') {
      // Success! Subscription is active
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return { 
        success: true, 
        message: 'Subscription activated successfully! You now have access to 10 reports per month.' 
      };
    } else {
      // Webhook might still be processing
      return { 
        success: false, 
        message: 'Payment received! Your subscription is being activated. Please refresh the page in a moment.' 
      };
    }
  } catch (error) {
    console.error('Error handling checkout success:', error);
    return { 
      success: false, 
      message: 'Error processing checkout. Please contact support if the issue persists.' 
    };
  }
};

