// ============================================================================
// Admin Recovery Edge Function
// ============================================================================
// This function allows recovery of admin access using ADMIN_RECOVERY_KEY
// 
// Usage:
// POST /admin-recovery
// Headers:
//   Authorization: Bearer <ADMIN_RECOVERY_KEY>
// Body:
//   {
//     "user_email": "user@example.com"
//   }
//
// Security:
// - Requires ADMIN_RECOVERY_KEY in environment variables
// - Logs all recovery attempts
// - Can be disabled by removing ADMIN_RECOVERY_KEY
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryRequest {
  user_email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get ADMIN_RECOVERY_KEY from environment
    const recoveryKey = Deno.env.get('ADMIN_RECOVERY_KEY');
    
    if (!recoveryKey) {
      console.error('❌ ADMIN_RECOVERY_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Recovery function not configured' }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify recovery key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const providedKey = authHeader.replace('Bearer ', '');
    if (providedKey !== recoveryKey) {
      console.error('❌ Invalid recovery key attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid recovery key' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { user_email }: RecoveryRequest = await req.json();
    
    if (!user_email || typeof user_email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'user_email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log recovery attempt
    console.log(`🔐 Admin recovery attempt for: ${user_email}`);

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_super_admin')
      .eq('email', user_email.toLowerCase())
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Set is_super_admin flag
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_super_admin: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user', details: updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful recovery
    console.log(`✅ Admin recovery successful for: ${user_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Super admin access granted to ${user_email}`,
        user_id: user.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Recovery function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

