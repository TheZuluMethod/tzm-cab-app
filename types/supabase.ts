/**
 * Supabase Type Definitions
 * 
 * Type definitions for Supabase User and related types
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Extended user type with profile data
 */
export interface AppUser extends Omit<SupabaseUser, 'user_metadata'> {
  user_metadata?: SupabaseUser['user_metadata'] & {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Dashboard data structure
 */
export interface DashboardData {
  research?: string;
  industryInsights?: string;
  marketData?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * QC Status structure
 */
export interface QCStatus {
  score: number;
  verified: number;
  total: number;
  issues: number;
}

