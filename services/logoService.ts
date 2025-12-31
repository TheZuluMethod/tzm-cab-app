/**
 * Logo Service
 * 
 * Handles loading the official Zulu Method logo from Supabase Storage.
 * The logo is stored in the "CAB Avatars" bucket at a fixed path.
 */

import { supabase } from './supabaseClient';

const LOGO_BUCKET = 'CAB Avatars';
const LOGO_PATH = 'brand/zulu-method-logo.png'; // Fixed path for brand logo (light mode)
const DARK_LOGO_PATH = 'brand/zulu-method-logo-white.png'; // Fixed path for dark mode logo

/**
 * Get the public URL for the Zulu Method logo (light mode)
 * Falls back to public folder if Supabase is not configured
 */
export const getLogoUrl = (): string | null => {
  // Get Supabase URL from environment or try to get it from the supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  
  // If we have the Supabase URL, construct the public URL directly
  if (supabaseUrl) {
    // Encode the bucket and path for URL
    const encodedBucket = encodeURIComponent(LOGO_BUCKET);
    const encodedPath = encodeURIComponent(LOGO_PATH);
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
    return publicUrl;
  }
  
  // Try using Supabase client if available
  if (supabase && typeof supabase.storage !== 'undefined') {
    try {
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(LOGO_PATH);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      // Silently fall through to fallback
    }
  }
  
  // Fallback to public folder
  return '/robot-logo.png';
};

/**
 * Get the public URL for the Zulu Method dark mode logo
 * Falls back to regular logo if dark logo not available
 */
export const getDarkLogoUrl = (): string | null => {
  // Get Supabase URL from environment or try to get it from the supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  
  // If we have the Supabase URL, construct the public URL directly
  if (supabaseUrl) {
    // Encode the bucket and path for URL
    const encodedBucket = encodeURIComponent(LOGO_BUCKET);
    const encodedPath = encodeURIComponent(DARK_LOGO_PATH);
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
    return publicUrl;
  }
  
  // Try using Supabase client if available
  if (supabase && typeof supabase.storage !== 'undefined') {
    try {
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(DARK_LOGO_PATH);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      // Silently fall through to fallback
    }
  }
  
  // Fallback to regular logo if dark logo not available
  return getLogoUrl();
};

/**
 * Check if logo exists in Supabase storage
 */
export const checkLogoExists = async (): Promise<boolean> => {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.storage.from(LOGO_BUCKET).list('brand', {
      limit: 1,
      search: 'zulu-method-logo'
    });
    
    return !error;
  } catch (error) {
    return false;
  }
};

