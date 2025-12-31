/**
 * Supabase Edge Function: Send Password Change Confirmation Email
 * 
 * This function sends a branded email notification when a user changes their password.
 * 
 * To use this:
 * 1. Deploy this function to Supabase
 * 2. Call it from your application after password change
 * 3. Configure SendGrid API key in Supabase secrets
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { userId, userEmail } = await req.json()

    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'userId and userEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get SendGrid API key from secrets
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromEmail = Deno.env.get('PASSWORD_CHANGE_FROM_EMAIL') || 'noreply@thezulumethod.com'
    const siteUrl = Deno.env.get('SITE_URL') || 'https://yourdomain.com'

    if (!sendGridApiKey) {
      console.warn('SENDGRID_API_KEY not configured, skipping email send')
      // Don't fail - just log and return success
      return new Response(
        JSON.stringify({ success: true, message: 'Email service not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Branded email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - The Zulu Method</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #221E1F;
            background-color: #F8F9FF;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #577AFF 0%, #31458F 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #A1B4FF;
            font-size: 14px;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #051A53;
            margin-bottom: 20px;
        }
        .text {
            font-size: 16px;
            color: #595657;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #577AFF;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }
        .footer {
            background-color: #EEF2FF;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #595657;
        }
        .footer a {
            color: #577AFF;
            text-decoration: none;
        }
        .security-note {
            background-color: #F9FAFD;
            border-left: 4px solid #34C759;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #595657;
        }
        .warning-note {
            background-color: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">The Zulu Method</div>
            <p class="subtitle">AI Customer Advisory Board</p>
        </div>
        
        <div class="content">
            <div class="success-icon">✅</div>
            <h1 class="title">Password Successfully Changed</h1>
            
            <p class="text">
                Your password has been successfully updated. You can now use your new password to sign in to your account.
            </p>
            
            <div class="security-note">
                <strong>What happened:</strong> Your password was changed on ${new Date().toLocaleString()}. If you made this change, no further action is needed.
            </div>
            
            <div class="warning-note">
                <strong>Security Alert:</strong> If you did NOT make this change, please contact our support team immediately. Your account security may be compromised.
            </div>
            
            <div style="text-align: center;">
                <a href="${siteUrl}" class="button">Sign In to Your Account</a>
            </div>
            
            <p class="text">
                For your security, we recommend:
            </p>
            <ul style="color: #595657; line-height: 1.8;">
                <li>Using a strong, unique password</li>
                <li>Not sharing your password with anyone</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Contacting support if you notice any suspicious activity</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent by The Zulu Method</p>
            <p>
                <a href="${siteUrl}">Visit our website</a> | 
                <a href="mailto:support@thezulumethod.com">Contact Support</a>
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                If you didn't change your password, please contact support immediately.
            </p>
        </div>
    </div>
</body>
</html>
    `

    // Send email via SendGrid
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: userEmail }],
          subject: 'Password Changed - The Zulu Method',
        }],
        from: { email: fromEmail, name: 'The Zulu Method' },
        content: [{
          type: 'text/html',
          value: emailHtml,
        }],
      }),
    })

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`Failed to send email: ${sendGridResponse.statusText}`)
    }

    // Mark email as sent in password_changes table
    await supabase
      .from('password_changes')
      .update({ email_sent: true })
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })
      .limit(1)

    return new Response(
      JSON.stringify({ success: true, message: 'Password change email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error sending password change email:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

