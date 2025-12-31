/**
 * Subscription and Trial Management Service
 * Handles subscription status, trial limits, and upgrade flows
 */

import { supabase } from './supabaseClient';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trial' | 'active' | 'canceled' | 'past_due' | 'expired';
  plan_type: 'trial' | 'monthly';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  trial_start: string;
  trial_end?: string;
  reports_used: number;
  reports_limit: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  canRunReport: boolean;
  reportsRemaining: number;
  isTrial: boolean;
  isActive: boolean;
  needsUpgrade: boolean;
  upgradeMessage?: string;
}

/**
 * Get current user's subscription status
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  if (!supabase) {
    // Fallback for development
    return {
      subscription: null,
      canRunReport: true,
      reportsRemaining: 999,
      isTrial: false,
      isActive: true,
      needsUpgrade: false,
    };
  }

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching subscription:', error);
      return {
        subscription: null,
        canRunReport: true, // Allow access on error
        reportsRemaining: 999,
        isTrial: false,
        isActive: true,
        needsUpgrade: false,
      };
    }

    if (!subscription) {
      // No subscription found - create trial
      return await createTrialSubscription(userId);
    }

    const isTrial = subscription.plan_type === 'trial';
    const isActive = subscription.status === 'active' || subscription.status === 'trial';
    const reportsRemaining = Math.max(0, subscription.reports_limit - subscription.reports_used);
    const canRunReport = isActive && reportsRemaining > 0;

    let upgradeMessage: string | undefined;
    if (!canRunReport) {
      if (isTrial) {
        upgradeMessage = 'You\'ve used your free trial report. Upgrade to unlock unlimited reports!';
      } else {
        upgradeMessage = 'You\'ve reached your monthly report limit. Your subscription will renew next month.';
      }
    }

    return {
      subscription,
      canRunReport,
      reportsRemaining,
      isTrial,
      isActive,
      needsUpgrade: !canRunReport,
      upgradeMessage,
    };
  } catch (error) {
    console.error('Error in getSubscriptionStatus:', error);
    return {
      subscription: null,
      canRunReport: true,
      reportsRemaining: 999,
      isTrial: false,
      isActive: true,
      needsUpgrade: false,
    };
  }
};

/**
 * Create a trial subscription for a user
 */
export const createTrialSubscription = async (userId: string): Promise<SubscriptionStatus> => {
  if (!supabase) {
    return {
      subscription: null,
      canRunReport: true,
      reportsRemaining: 1,
      isTrial: true,
      isActive: true,
      needsUpgrade: false,
    };
  }

  try {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30); // 30 day trial

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: 'trial',
        plan_type: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        reports_used: 0,
        reports_limit: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating trial subscription:', error);
      throw error;
    }

    // Log trial started event
    await logSubscriptionEvent(userId, subscription.id, 'trial_started', {
      trial_end: trialEnd.toISOString(),
    });

    return {
      subscription,
      canRunReport: true,
      reportsRemaining: 1,
      isTrial: true,
      isActive: true,
      needsUpgrade: false,
    };
  } catch (error) {
    console.error('Error in createTrialSubscription:', error);
    return {
      subscription: null,
      canRunReport: true,
      reportsRemaining: 1,
      isTrial: true,
      isActive: true,
      needsUpgrade: false,
    };
  }
};

/**
 * Increment reports used count
 */
export const incrementReportsUsed = async (userId: string): Promise<boolean> => {
  if (!supabase) return true;

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!subscription) return true;

    const newReportsUsed = subscription.reports_used + 1;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        reports_used: newReportsUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error incrementing reports used:', error);
      return false;
    }

    // Log trial completed if this was their first report
    if (subscription.plan_type === 'trial' && newReportsUsed === 1) {
      await logSubscriptionEvent(userId, subscription.id, 'trial_completed', {
        reports_used: newReportsUsed,
      });
    }

    return true;
  } catch (error) {
    console.error('Error in incrementReportsUsed:', error);
    return false;
  }
};

/**
 * Log subscription event
 */
export const logSubscriptionEvent = async (
  userId: string,
  subscriptionId: string | null,
  eventType: string,
  metadata?: Record<string, any>
): Promise<void> => {
  if (!supabase) return;

  try {
    await supabase.from('subscription_events').insert({
      user_id: userId,
      subscription_id: subscriptionId,
      event_type: eventType,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Error logging subscription event:', error);
  }
};

/**
 * Update subscription after successful payment
 */
export const updateSubscriptionAfterPayment = async (
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: 'monthly',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: stripePriceId,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        reports_limit: 10, // Monthly plan gets 10 reports
        reports_used: 0, // Reset counter
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription after payment:', error);
      return false;
    }

    // Log upgrade completed event
    await logSubscriptionEvent(userId, null, 'upgrade_completed', {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    });

    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionAfterPayment:', error);
    return false;
  }
};

