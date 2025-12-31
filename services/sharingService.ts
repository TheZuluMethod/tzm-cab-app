/**
 * Report Sharing Service
 * 
 * Handles generation and management of shareable report links
 */

import { supabase } from './supabaseClient';
import { SavedSession } from '../types';

export interface SharedReport {
  id: string;
  sessionId: string;
  shareToken: string;
  password?: string;
  expiresAt?: string;
  accessCount: number;
  createdAt: string;
  createdBy: string;
}

/**
 * Generate a unique share token
 */
const generateShareToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Create a shareable link for a report
 */
export const createShareableLink = async (
  sessionId: string,
  userId: string,
  options?: {
    password?: string;
    expiresInDays?: number;
  }
): Promise<{ shareToken: string; shareUrl: string; error: string | null }> => {
  try {
    if (!supabase) {
      return { shareToken: '', shareUrl: '', error: 'Supabase not configured' };
    }

    const shareToken = generateShareToken();
    const expiresAt = options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('shared_reports')
      .insert({
        session_id: sessionId,
        share_token: shareToken,
        password: options?.password || null,
        expires_at: expiresAt,
        access_count: 0,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shareable link:', error);
      return { shareToken: '', shareUrl: '', error: error.message };
    }

    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    return { shareToken, shareUrl, error: null };
  } catch (error) {
    console.error('Error in createShareableLink:', error);
    return {
      shareToken: '',
      shareUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get shared report by token
 */
export const getSharedReport = async (
  shareToken: string,
  password?: string
): Promise<{ session: SavedSession | null; error: string | null }> => {
  try {
    if (!supabase) {
      return { session: null, error: 'Supabase not configured' };
    }

    const { data: sharedReport, error: fetchError } = await supabase
      .from('shared_reports')
      .select('*, sessions(*)')
      .eq('share_token', shareToken)
      .single();

    if (fetchError || !sharedReport) {
      return { session: null, error: 'Shared report not found' };
    }

    // Check if expired
    if (sharedReport.expires_at && new Date(sharedReport.expires_at) < new Date()) {
      return { session: null, error: 'This shared link has expired' };
    }

    // Check password if required
    if (sharedReport.password && sharedReport.password !== password) {
      return { session: null, error: 'Incorrect password' };
    }

    // Increment access count
    await supabase
      .from('shared_reports')
      .update({ access_count: (sharedReport.access_count || 0) + 1 })
      .eq('id', sharedReport.id);

    // Convert session data to SavedSession format
    const sessionData = sharedReport.sessions as any;
    if (!sessionData) {
      return { session: null, error: 'Session data not found' };
    }

    const session: SavedSession = {
      id: sessionData.id,
      date: sessionData.created_at ? new Date(sessionData.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      timestamp: sessionData.created_at ? new Date(sessionData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      title: sessionData.title,
      input: sessionData.input,
      members: sessionData.members || [],
      report: sessionData.report || '',
      icpProfile: sessionData.icp_profile,
      personaBreakdowns: sessionData.persona_breakdowns,
      competitorAnalysis: sessionData.competitor_analysis,
    };

    return { session, error: null };
  } catch (error) {
    console.error('Error in getSharedReport:', error);
    return {
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Revoke a shared link
 */
export const revokeShareableLink = async (
  shareToken: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('shared_reports')
      .delete()
      .eq('share_token', shareToken)
      .eq('created_by', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get all shared links for a user
 */
export const getUserSharedLinks = async (
  userId: string
): Promise<{ links: SharedReport[]; error: string | null }> => {
  try {
    if (!supabase) {
      return { links: [], error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { links: [], error: error.message };
    }

    return { links: data || [], error: null };
  } catch (error) {
    return {
      links: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

