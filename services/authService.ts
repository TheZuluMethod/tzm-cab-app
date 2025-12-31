/**
 * Authentication Service
 * 
 * Handles user authentication including signup, login, password reset,
 * and OAuth providers (Google, Microsoft/Outlook).
 * 
 * @module authService
 */

import { supabase } from './supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  if (!supabase) {
    console.warn('⚠️ Supabase is not configured. Authentication features are disabled.');
    return false;
  }
  return true;
};

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (credentials: SignUpCredentials): Promise<AuthResponse> => {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }
  try {
    const { data, error } = await supabase!.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName || '',
        },
      },
    });

    // Track referral if user signed up with referral code
    if (data.user && !error) {
      // Import dynamically to avoid circular dependency
      const { trackReferralSignup } = await import('./referralService');
      trackReferralSignup(credentials.email, data.user.id).catch(err => {
        console.warn('Failed to track referral signup:', err);
        // Don't fail signup if referral tracking fails
      });
    }

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (credentials: SignInCredentials): Promise<AuthResponse> => {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }
  try {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured()) {
    return { error: null }; // No-op if not configured
  }
  try {
    const { error } = await supabase!.auth.signOut();
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Send password reset email
 * Uses branded email templates configured in Supabase
 */
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }

  try {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      // Email options for branded templates
      // Supabase will use custom email templates if configured in Dashboard
    });
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Update user password (after password reset)
 */
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Change user password (requires current password)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }

  try {
    // First verify current password by attempting to sign in
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user || !user.email) {
      return { error: { message: 'User not found' } as AuthError };
    }

    // Verify current password
    const { error: signInError } = await supabase!.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { error: { message: 'Current password is incorrect' } as AuthError };
    }

    // Update to new password
    const { error: updateError } = await supabase!.auth.updateUser({
      password: newPassword,
    });

    return { error: updateError };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Sign in with Microsoft/Outlook OAuth
 */
export const signInWithMicrosoft = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Send magic link (passwordless login) email
 */
export const sendMagicLink = async (email: string): Promise<{ error: AuthError | null }> => {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }

  try {
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true, // Allow signup via magic link
      },
    });
    return { error };
  } catch (error: any) {
    return { error: error as AuthError };
  }
};

/**
 * Verify magic link token from email
 */
export const verifyMagicLink = async (token: string, type: 'email' | 'recovery' = 'email'): Promise<AuthResponse> => {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured. Please check your environment variables.' } as AuthError,
    };
  }

  try {
    const { data, error } = await supabase!.auth.verifyOtp({
      token_hash: token,
      type: type === 'recovery' ? 'recovery' : 'email',
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
};

/**
 * Get the current user session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data: { session } } = await supabase!.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const { data: { user } } = await supabase!.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isSupabaseConfigured()) {
    // Return a dummy subscription that does nothing
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase!.auth.onAuthStateChange((_event: string, session: Session | null) => {
    callback(session?.user ?? null);
  });
};

