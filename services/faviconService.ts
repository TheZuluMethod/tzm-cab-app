/**
 * Favicon Service
 * 
 * Handles loading the favicon from Supabase Storage.
 * The favicon is stored in the "CAB Avatars" bucket.
 */

import { supabase } from './supabaseClient';

const FAVICON_BUCKET = 'CAB Avatars';
// Try root level first, then check brand folder
const FAVICON_PATHS = [
  'The Zulu Method favicon color.png', // Root level
  'brand/The Zulu Method favicon color.png' // In brand folder
];

/**
 * Get the public URL for the favicon
 * Falls back to default favicon if Supabase is not configured
 */
export const getFaviconUrl = (): string => {
  // Get Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  
  // If we have the Supabase URL, construct the public URL directly
  if (supabaseUrl) {
    // Try first path (root level)
    const encodedBucket = encodeURIComponent(FAVICON_BUCKET);
    const encodedPath = encodeURIComponent(FAVICON_PATHS[0]);
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
    return publicUrl;
  }
  
  // Try using Supabase client if available
  if (supabase && typeof supabase.storage !== 'undefined') {
    try {
      // Try first path
      const { data } = supabase.storage.from(FAVICON_BUCKET).getPublicUrl(FAVICON_PATHS[0]);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      // Try second path if first fails
      try {
        const { data } = supabase.storage.from(FAVICON_BUCKET).getPublicUrl(FAVICON_PATHS[1]);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      } catch (error2) {
        console.warn('Could not get favicon URL from Supabase:', error2);
      }
    }
  }
  
  // Fallback to default favicon (or empty string to let browser use default)
  return '/favicon.ico';
};
