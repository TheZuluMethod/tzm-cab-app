/**
 * Session Service
 * 
 * Handles storing and retrieving user board sessions from Supabase.
 * Replaces localStorage-based storage with secure backend storage.
 * 
 * @module sessionService
 */

import { supabase } from './supabaseClient';
import type { SavedSession } from '../types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  if (!supabase) {
    return false;
  }
  return true;
};

export interface DatabaseSession {
  id: string;
  user_id: string;
  title: string;
  input: any;
  members: any;
  report: string;
  icp_profile: any | null;
  persona_breakdowns: any | null;
  dashboard_data: any | null;
  qc_status: any | null;
  competitor_analysis: any | null;
  status: string | null;
  app_state: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database session to SavedSession format
 */
const dbSessionToSavedSession = (dbSession: DatabaseSession): SavedSession => {
  return {
    id: dbSession.id,
    date: new Date(dbSession.created_at).toLocaleDateString(),
    timestamp: new Date(dbSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: dbSession.title,
    input: dbSession.input,
    members: dbSession.members,
    report: dbSession.report,
    icpProfile: dbSession.icp_profile,
    personaBreakdowns: dbSession.persona_breakdowns,
    dashboardData: dbSession.dashboard_data || undefined,
    qcStatus: dbSession.qc_status || undefined,
    competitorAnalysis: dbSession.competitor_analysis || undefined,
    appState: dbSession.app_state || undefined,
  };
};

/**
 * Save a session to the database
 */
export const saveSession = async (
  session: SavedSession,
  dashboardData?: any,
  qcStatus?: any,
  competitorAnalysis?: any
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const existing = localStorage.getItem('zulu_sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      const updated = [session, ...sessions.filter((s: SavedSession) => s.id !== session.id)];
      localStorage.setItem('zulu_sessions', JSON.stringify(updated));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use UUID for session ID if current ID is not a valid UUID
    // This ensures compatibility and prevents conflicts
    let sessionId = session.id;
    if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Generate a proper UUID v4 using crypto.randomUUID() (browser native)
      // This ensures the database accepts it as a valid UUID
      sessionId = crypto.randomUUID();
    }

    // Validate data before saving to prevent corruption
    if (!session.input || typeof session.input !== 'object') {
      return { success: false, error: 'Invalid input data' };
    }
    if (!Array.isArray(session.members)) {
      return { success: false, error: 'Invalid members data' };
    }
    if (typeof session.report !== 'string') {
      return { success: false, error: 'Invalid report data' };
    }
    
    // Validate members have required fields
    const validMembers = session.members.filter(m => 
      m && typeof m === 'object' && m.id && m.name && m.role
    );
    if (validMembers.length === 0 && session.members.length > 0) {
      return { success: false, error: 'No valid members found' };
    }

    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: sessionId,
        user_id: user.id,
        title: session.title || 'Untitled Session',
        input: session.input,
        members: validMembers.length > 0 ? validMembers : session.members, // Use validated members if available
        report: session.report,
        icp_profile: session.icpProfile || null,
        persona_breakdowns: session.personaBreakdowns || null,
        dashboard_data: dashboardData || null, // Save dashboard data (null is expected - industry data removed)
        qc_status: qcStatus || null, // Save QC status
        competitor_analysis: competitorAnalysis || null, // Save competitor analysis data
        status: 'complete', // Mark as complete when saving final session
        app_state: session.appState || 'complete', // Save app state
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error saving session:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving session:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get all sessions for the current user
 */
export const getSessions = async (): Promise<{ sessions: SavedSession[]; error?: string }> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const existing = localStorage.getItem('zulu_sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      return { sessions };
    } catch (error: any) {
      return { sessions: [], error: error.message };
    }
  }
  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { sessions: [], error: 'User not authenticated' };
    }

    // For admin users, we might want to get all sessions, but for now, 
    // let's keep it user-specific. The admin analytics dashboard uses a separate query.
    const { data, error } = await supabase!
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'complete') // Only get completed sessions for the history view
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      // Check if it's a permission/RLS error
      const isPermissionError = error.code === '42501' || 
                                error.message?.toLowerCase().includes('permission') ||
                                error.message?.toLowerCase().includes('policy') ||
                                error.message?.toLowerCase().includes('row-level security');
      
      if (isPermissionError) {
        // Permission errors are expected if RLS policies aren't set up yet
        // Return empty array instead of error
        console.warn('RLS permission issue (this may be expected if policies not configured):', error.message);
        return { sessions: [] };
      }
      
      return { sessions: [], error: error.message };
    }

    const sessions = (data || []).map(dbSessionToSavedSession);
    return { sessions };
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    const errorMessage = error?.message || String(error);
    const isPermissionError = errorMessage?.toLowerCase().includes('permission') ||
                             errorMessage?.toLowerCase().includes('policy') ||
                             errorMessage?.toLowerCase().includes('row-level security');
    
    if (isPermissionError) {
      // Permission errors - return empty array instead of error
      console.warn('RLS permission issue (this may be expected):', errorMessage);
      return { sessions: [] };
    }
    
    return { sessions: [], error: errorMessage };
  }
};

/**
 * Get a single session by ID
 */
export const getSession = async (sessionId: string): Promise<{ session: SavedSession | null; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { session: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return { session: null, error: error.message };
    }

    if (!data) {
      return { session: null, error: 'Session not found' };
    }

    return { session: dbSessionToSavedSession(data) };
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return { session: null, error: error.message || 'Unknown error' };
  }
};

/**
 * Delete a session
 */
export const deleteSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const existing = localStorage.getItem('zulu_sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      const updated = sessions.filter((s: SavedSession) => s.id !== sessionId);
      localStorage.setItem('zulu_sessions', JSON.stringify(updated));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting session:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Migrate localStorage sessions to Supabase (one-time migration)
 */
export const migrateLocalStorageSessions = async (): Promise<{ migrated: number; errors: number }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { migrated: 0, errors: 0 };
    }

    // Get sessions from localStorage
    const localSessionsJson = localStorage.getItem('zulu_sessions');
    if (!localSessionsJson) {
      return { migrated: 0, errors: 0 };
    }

    const localSessions: SavedSession[] = JSON.parse(localSessionsJson);
    let migrated = 0;
    let errors = 0;

    // Migrate each session
    for (const session of localSessions) {
      try {
        const result = await saveSession(session);
        if (result.success) {
          migrated++;
        } else {
          errors++;
          // Check if it's a UUID error specifically
          const isUuidError = result.error?.includes('uuid') || result.error?.includes('invalid input syntax');
          if (isUuidError) {
            console.error(`Failed to migrate session ${session.id}: Invalid UUID format. Session will be migrated with a new UUID.`, result.error);
          } else {
            console.error(`Failed to migrate session ${session.id}:`, result.error);
          }
        }
      } catch (error: any) {
        errors++;
        const errorMessage = error?.message || String(error);
        const isUuidError = errorMessage.includes('uuid') || errorMessage.includes('invalid input syntax');
        if (isUuidError) {
          console.error(`Failed to migrate session ${session.id}: Invalid UUID format.`, errorMessage);
        } else {
          console.error(`Failed to migrate session ${session.id}:`, errorMessage);
        }
      }
    }

    // Clear localStorage after successful migration
    if (migrated > 0 && errors === 0) {
      localStorage.removeItem('zulu_sessions');
    }

    return { migrated, errors };
  } catch (error: any) {
    console.error('Error migrating sessions:', error);
    return { migrated: 0, errors: 1 };
  }
};

