/**
 * Supabase Client Configuration
 * 
 * Initializes and exports the Supabase client for database and authentication operations.
 * 
 * @module supabaseClient
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials are missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('Current values:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing'
  });
  // Don't throw error in development - allow app to run with fallback
  if (import.meta.env.DEV) {
    console.warn('⚠️ Running without Supabase - authentication will be disabled');
  } else {
    throw new Error('Supabase configuration is missing. Please check your .env file.');
  }
}

/**
 * Supabase client instance
 * 
 * This client is used for all database operations and authentication.
 * It uses the anon key which is safe for client-side use.
 * Returns null if credentials are missing (app will use localStorage fallback).
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null as any; // Fallback - services will check for null and use localStorage

/**
 * Database Types (will be generated from Supabase schema)
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          company: string | null;
          bio: string | null;
          website: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          company?: string | null;
          bio?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          company?: string | null;
          bio?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          input: any; // JSONB
          members: any; // JSONB array
          report: string;
          icp_profile: any | null; // JSONB
          persona_breakdowns: any | null; // JSONB array
          dashboard_data: any | null; // JSONB
          qc_status: any | null; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          input: any;
          members: any;
          report: string;
          icp_profile?: any | null;
          persona_breakdowns?: any | null;
          dashboard_data?: any | null;
          qc_status?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          input?: any;
          members?: any;
          report?: string;
          icp_profile?: any | null;
          persona_breakdowns?: any | null;
          dashboard_data?: any | null;
          qc_status?: any | null;
          updated_at?: string;
        };
      };
    };
  };
};

