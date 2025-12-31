/**
 * Rate Limiting Edge Function
 * 
 * Server-side rate limiting for API endpoints to prevent abuse
 * and ensure fair usage across all users.
 * 
 * Features:
 * - IP-based rate limiting
 * - User-based rate limiting (for authenticated users)
 * - Configurable limits per endpoint
 * - Automatic cleanup of old entries
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Rate limit configurations per endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'generate-board': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  'generate-icp': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  'generate-personas': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  'stream-analysis': { windowMs: 60 * 1000, maxRequests: 3 }, // 3 per minute
  'default': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute default
};

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get endpoint from request
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'default';
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];

    // Get identifier (IP address or user ID)
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    // Try to get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const userClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: authHeader },
            },
          }
        );
        const { data: { user } } = await userClient.auth.getUser();
        userId = user?.id || null;
      } catch {
        // Auth failed, continue with IP-based limiting
      }
    }

    // Use user ID if available, otherwise use IP
    const identifier = userId || `ip:${ipAddress}`;
    const identifierType = userId ? 'user' : 'ip';

    // Get current timestamp
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Check rate limit in database
    const { data: existingLimits, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', new Date(windowStart).toISOString())
      .order('created_at', { ascending: false });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching rate limits:', fetchError);
      // Fail open - allow request if we can't check limits
      return new Response(
        JSON.stringify({ allowed: true, reason: 'rate_limit_check_failed' }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestCount = existingLimits?.length || 0;

    // Check if limit exceeded
    if (requestCount >= config.maxRequests) {
      const oldestRequest = existingLimits?.[existingLimits.length - 1];
      const resetAt = oldestRequest 
        ? new Date(new Date(oldestRequest.created_at).getTime() + config.windowMs).getTime()
        : now + config.windowMs;
      
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'rate_limit_exceeded',
          retryAfter,
          limit: config.maxRequests,
          windowMs: config.windowMs,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetAt.toString(),
          },
        }
      );
    }

    // Record this request
    const { error: insertError } = await supabaseClient
      .from('rate_limits')
      .insert({
        identifier,
        identifier_type: identifierType,
        endpoint,
        ip_address: identifierType === 'ip' ? ipAddress : null,
        user_id: identifierType === 'user' ? userId : null,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error recording rate limit:', insertError);
      // Continue anyway - logging failure shouldn't block requests
    }

    // Cleanup old entries (non-blocking)
    supabaseClient
      .from('rate_limits')
      .delete()
      .lt('created_at', new Date(now - (config.windowMs * 2)).toISOString())
      .then(() => {
        // Cleanup successful
      })
      .catch((err) => {
        console.warn('Rate limit cleanup failed:', err);
      });

    // Request allowed
    const remaining = config.maxRequests - requestCount - 1;
    const resetAt = now + config.windowMs;

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining,
        limit: config.maxRequests,
        resetAt,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": resetAt.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error('Rate limit function error:', error);
    // Fail open - allow request if function fails
    return new Response(
      JSON.stringify({ allowed: true, reason: 'error', error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});

