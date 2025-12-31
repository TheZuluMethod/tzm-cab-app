/**
 * Draft Session Service
 * 
 * Handles saving draft/in-progress sessions at each step to prevent data loss.
 * Provides incremental saves with validation and error recovery.
 */

import { supabase } from './supabaseClient';
import type { UserInput, BoardMember } from '../types';
import { AppState } from '../types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  if (!supabase) {
    return false;
  }
  return true;
};

export type DraftSessionData = {
  id?: string;
  input?: Partial<UserInput>;
  members?: BoardMember[];
  report?: string;
  icpProfile?: any;
  personaBreakdowns?: any[];
  dashboardData?: any;
  qcStatus?: any;
  competitorAnalysis?: any;
  appState?: AppState;
  status?: 'draft' | 'complete';
}

/**
 * Validate session data before saving
 */
const validateSessionData = (data: DraftSessionData): { valid: boolean; error?: string } => {
  // Basic validation - ensure we have at least some data
  if (!data.input && !data.members && !data.report) {
    return { valid: false, error: 'No data to save' };
  }

  // Validate input if present
  if (data.input) {
    if (typeof data.input !== 'object') {
      return { valid: false, error: 'Invalid input data format' };
    }
  }

  // Validate members if present
  if (data.members) {
    if (!Array.isArray(data.members)) {
      return { valid: false, error: 'Invalid members data format' };
    }
    // Validate each member has required fields
    for (const member of data.members) {
      if (!member || typeof member !== 'object' || !member.id || !member.name || !member.role) {
        return { valid: false, error: 'Invalid member data structure' };
      }
    }
  }

  // Validate report if present
  if (data.report !== undefined && typeof data.report !== 'string') {
    return { valid: false, error: 'Invalid report data format' };
  }

  return { valid: true };
};

/**
 * Save or update a draft session
 * This is called at each step to preserve user progress
 */
export const saveDraftSession = async (
  data: DraftSessionData,
  sessionId?: string
): Promise<{ success: boolean; error?: string; sessionId?: string }> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const draftId = sessionId || `draft_${Date.now()}`;
      const draftData = {
        id: draftId,
        ...data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`zulu_draft_${draftId}`, JSON.stringify(draftData));
      return { success: true, sessionId: draftId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate data before saving
    const validation = validateSessionData(data);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid data' };
    }

    // Generate or use provided session ID
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      // Try to find existing draft session for this user
      const { data: existingDrafts, error: draftError } = await supabase!
        .from('sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to avoid 406 error when no draft exists

      if (draftError && draftError.code !== 'PGRST116') {
        // Log non-"no rows" errors but continue
        console.warn('Error checking for existing draft session:', draftError);
      }

      if (existingDrafts && existingDrafts.id) {
        finalSessionId = existingDrafts.id;
      } else {
        finalSessionId = crypto.randomUUID();
      }
    }

    // Ensure session ID is a valid UUID
    if (!finalSessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      finalSessionId = crypto.randomUUID();
    }

    // Build update object - only include fields that are present
    // Use try-catch to prevent corruption from invalid data
    try {
      const updateData: any = {
        id: finalSessionId,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        status: data.status || 'draft',
      };
      
      // Validate and sanitize data before saving to prevent corruption
      // Only update fields that are provided (partial update)
      // Validate each field before adding to prevent corruption
      if (data.input) {
        // Validate input is an object
        if (typeof data.input === 'object' && data.input !== null) {
          updateData.input = data.input;
        } else {
          console.warn('Invalid input data format, skipping save');
        }
      }
      if (data.members) {
        // Validate members is an array
        if (Array.isArray(data.members)) {
          // Validate each member has required fields
          const validMembers = data.members.filter(m => 
            m && typeof m === 'object' && m.id && m.name && m.role
          );
          if (validMembers.length > 0) {
            updateData.members = validMembers;
          } else {
            console.warn('No valid members found, skipping save');
          }
        } else {
          console.warn('Invalid members data format, skipping save');
        }
      }
      if (data.report !== undefined) {
        // Validate report is a string
        if (typeof data.report === 'string') {
          updateData.report = data.report || '';
        } else {
          console.warn('Invalid report data format, skipping save');
        }
      }
      if (data.icpProfile !== undefined) {
        // Validate icpProfile is an object or null
        if (data.icpProfile === null || (typeof data.icpProfile === 'object' && data.icpProfile !== null)) {
          updateData.icp_profile = data.icpProfile || null;
        } else {
          console.warn('Invalid icpProfile data format, skipping save');
        }
      }
      if (data.personaBreakdowns !== undefined) {
        // Validate personaBreakdowns is an array or null
        if (data.personaBreakdowns === null || Array.isArray(data.personaBreakdowns)) {
          updateData.persona_breakdowns = data.personaBreakdowns || null;
        } else {
          console.warn('Invalid personaBreakdowns data format, skipping save');
        }
      }
      if (data.dashboardData !== undefined) {
        // Validate dashboardData is an object or null
        if (data.dashboardData === null || (typeof data.dashboardData === 'object' && data.dashboardData !== null)) {
          updateData.dashboard_data = data.dashboardData || null;
        } else {
          console.warn('Invalid dashboardData format, skipping save');
        }
      }
      if (data.qcStatus !== undefined) {
        // Validate qcStatus is an object or null
        if (data.qcStatus === null || (typeof data.qcStatus === 'object' && data.qcStatus !== null)) {
          updateData.qc_status = data.qcStatus || null;
        } else {
          console.warn('Invalid qcStatus format, skipping save');
        }
      }
      if (data.competitorAnalysis !== undefined) {
        // Validate competitorAnalysis is an object or null
        if (data.competitorAnalysis === null || (typeof data.competitorAnalysis === 'object' && data.competitorAnalysis !== null)) {
          updateData.competitor_analysis = data.competitorAnalysis || null;
        } else {
          console.warn('Invalid competitorAnalysis format, skipping save');
        }
      }
      if (data.appState) {
        // Validate appState is a valid AppState enum value
        const validStates = ['WELCOME', 'ICP_SETUP', 'SETUP', 'ASSEMBLING', 'BOARD_READY', 'ANALYZING', 'COMPLETE', 'ERROR'];
        if (validStates.includes(data.appState)) {
          updateData.app_state = data.appState;
        } else {
          console.warn('Invalid appState value, skipping save');
        }
      }
      
      // Set title if we have input data
      if (data.input && data.input.feedbackItem && data.input.feedbackType) {
        // Generate a simple title from feedback
        const title = data.input.feedbackItem.substring(0, 100) || 'Draft Session';
        updateData.title = title;
      } else if (!updateData.title) {
        updateData.title = 'Draft Session';
      }

      // Use upsert to create or update
      const { error } = await supabase!
        .from('sessions')
        .upsert(updateData, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error saving draft session:', error);
        return { success: false, error: error.message };
      }

      return { success: true, sessionId: finalSessionId };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving draft session:', errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving draft session:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get the most recent draft session for recovery
 */
export const getLatestDraftSession = async (): Promise<{ session: DraftSessionData | null; error?: string }> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('zulu_draft_'));
      if (keys.length === 0) {
        return { session: null };
      }
      const latestKey = keys.sort().reverse()[0];
      const draftData = JSON.parse(localStorage.getItem(latestKey) || '{}');
      return { session: draftData };
    } catch (error: any) {
      return { session: null, error: error.message };
    }
  }

  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { session: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase!
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to avoid 406 error when no draft exists

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        // No rows returned - no draft session exists
        return { session: null };
      }
      console.error('Error fetching draft session:', error);
      return { session: null, error: error.message };
    }

    if (!data) {
      return { session: null };
    }

    return {
      session: {
        id: data.id,
        input: data.input,
        members: data.members,
        report: data.report,
        icpProfile: data.icp_profile,
        personaBreakdowns: data.persona_breakdowns,
        dashboardData: data.dashboard_data,
        qcStatus: data.qc_status,
        competitorAnalysis: data.competitor_analysis,
        appState: data.app_state as AppState,
        status: data.status as 'draft' | 'complete',
      }
    };
  } catch (error: any) {
    console.error('Error fetching draft session:', error);
    return { session: null, error: error.message || 'Unknown error' };
  }
};

/**
 * Mark a draft session as complete
 */
export const markSessionComplete = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: true }; // localStorage doesn't need status update
  }

  try {
    const { data: { user } } = await supabase!.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase!
      .from('sessions')
      .update({
        status: 'complete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking session complete:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error marking session complete:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

