/**
 * Referral Service
 * 
 * Handles referral tracking, code generation, and credit application
 */

import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referral_code: string;
  status: 'pending' | 'signed_up' | 'converted' | 'credit_applied';
  signed_up_at?: string;
  converted_at?: string;
  credit_applied_at?: string;
  referred_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  signedUpReferrals: number;
  convertedReferrals: number;
  creditsApplied: number;
  canReferMore: boolean;
}

/**
 * Generate a unique referral code for the current user
 */
export const generateReferralCode = async (): Promise<{ code: string; error: Error | null }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { code: '', error: new Error('User not authenticated') };
    }

    // Check if user already has a referral code
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', user.id)
      .limit(1)
      .single();

    if (existingReferral && !checkError) {
      return { code: existingReferral.referral_code, error: null };
    }

    // Generate new referral code
    const { data, error } = await supabase.rpc('generate_referral_code');
    
    if (error) {
      console.error('Error generating referral code:', error);
      return { code: '', error };
    }

    return { code: data, error: null };
  } catch (err: any) {
    console.error('Error in generateReferralCode:', err);
    return { code: '', error: err };
  }
};

/**
 * Check if user can refer more people (max 5)
 */
export const canReferMore = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('can_refer_more', {
      p_referrer_id: user.id
    });

    if (error) {
      console.error('Error checking referral limit:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Error in canReferMore:', err);
    return false;
  }
};

/**
 * Create a referral for a colleague
 */
export const createReferral = async (
  referredEmail: string
): Promise<{ success: boolean; error: Error | null; referralCode?: string }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: new Error('User not authenticated') };
    }

    // Check if can refer more
    const canRefer = await canReferMore();
    if (!canRefer) {
      return { success: false, error: new Error('You have reached the maximum of 5 referrals') };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referredEmail)) {
      return { success: false, error: new Error('Invalid email address') };
    }

    // Check if email is already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)
      .eq('referred_email', referredEmail.toLowerCase())
      .single();

    if (existing) {
      return { success: false, error: new Error('This email has already been referred') };
    }

    // Generate referral code
    const { code, error: codeError } = await generateReferralCode();
    if (codeError || !code) {
      return { success: false, error: codeError || new Error('Failed to generate referral code') };
    }

    // Create referral
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        referred_email: referredEmail.toLowerCase(),
        referral_code: code,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral:', error);
      return { success: false, error };
    }

    // Send referral email via SendGrid
    try {
      const referralLink = getReferralLink(code);
      const referrerName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'A colleague';
      
      // Get SendGrid template ID from environment (optional)
      const templateId = import.meta.env['VITE_SENDGRID_REFERRAL_TEMPLATE_ID'];
      
      const { sendReferralEmail } = await import('./sendgridService');
      const emailResult = await sendReferralEmail(
        referredEmail.toLowerCase(),
        referrerName,
        referralLink,
        templateId
      );

      if (!emailResult.success) {
        console.warn('Failed to send referral email:', emailResult.error);
        // Don't fail the referral creation if email fails
      }
    } catch (emailError) {
      console.warn('Error sending referral email:', emailError);
      // Don't fail the referral creation if email fails
    }

    return { success: true, error: null, referralCode: code };
  } catch (err: any) {
    console.error('Error in createReferral:', err);
    return { success: false, error: err };
  }
};

/**
 * Get referral statistics for current user
 */
export const getReferralStats = async (): Promise<{ stats: ReferralStats | null; error: Error | null }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { stats: null, error: new Error('User not authenticated') };
    }

    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return { stats: null, error };
    }

    const stats: ReferralStats = {
      totalReferrals: referrals?.length || 0,
      pendingReferrals: referrals?.filter((r: Referral) => r.status === 'pending').length || 0,
      signedUpReferrals: referrals?.filter((r: Referral) => r.status === 'signed_up').length || 0,
      convertedReferrals: referrals?.filter((r: Referral) => r.status === 'converted' || r.status === 'credit_applied').length || 0,
      creditsApplied: referrals?.filter((r: Referral) => r.status === 'credit_applied').length || 0,
      canReferMore: (referrals?.length || 0) < 5
    };

    return { stats, error: null };
  } catch (err: any) {
    console.error('Error in getReferralStats:', err);
    return { stats: null, error: err };
  }
};

/**
 * Get all referrals for current user
 */
export const getUserReferrals = async (): Promise<{ referrals: Referral[] | null; error: Error | null }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { referrals: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return { referrals: null, error };
    }

    return { referrals: data as Referral[], error: null };
  } catch (err: any) {
    console.error('Error in getUserReferrals:', err);
    return { referrals: null, error: err };
  }
};

/**
 * Get referral code for sharing
 */
export const getReferralLink = (referralCode: string): string => {
  return `https://thezulumethod.com/cab?ref=${referralCode}`;
};

/**
 * Track referral when a new user signs up
 */
export const trackReferralSignup = async (userEmail: string, userId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Check if user signed up with a referral code
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');

    if (!referralCode) {
      return { success: true, error: null }; // No referral code, nothing to track
    }

    // Find the referral by code
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('referred_email', userEmail.toLowerCase())
      .single();

    if (findError || !referral) {
      console.warn('Referral not found or email mismatch:', findError);
      return { success: false, error: findError || new Error('Referral not found') };
    }

    // Update referral status to 'signed_up'
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'signed_up',
        referred_user_id: userId,
        signed_up_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('Error updating referral status:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in trackReferralSignup:', err);
    return { success: false, error: err };
  }
};

/**
 * Track referral conversion when user becomes a paying customer
 */
export const trackReferralConversion = async (userId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Find referral for this user
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('status', 'signed_up')
      .single();

    if (findError || !referral) {
      // No referral found, that's okay
      return { success: true, error: null };
    }

    // Update referral status to 'converted'
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('Error updating referral conversion:', updateError);
      return { success: false, error: updateError };
    }

    // Apply credit to referrer using database function
    const { error: creditError } = await supabase.rpc('apply_referral_credit', {
      p_referral_id: referral.id
    });

    if (creditError) {
      console.error('Error applying referral credit:', creditError);
      return { success: false, error: creditError };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error in trackReferralConversion:', err);
    return { success: false, error: err };
  }
};

