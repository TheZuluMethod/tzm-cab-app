/**
 * Create SendGrid Email Drafts for Referral System
 * 
 * Run this script to create email drafts in SendGrid:
 * 
 * Option 1: Using tsx (recommended)
 *   npx tsx scripts/create-sendgrid-drafts.ts
 * 
 * Option 2: Using Node.js directly (if you convert to .js)
 *   node scripts/create-sendgrid-drafts.js
 * 
 * Requires SENDGRID_API_KEY environment variable in .env file
 */

// Simple dotenv implementation for Node.js
function loadEnv() {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line: string) => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore if dotenv fails
  }
}

loadEnv();

const SENDGRID_API_KEY = process.env['SENDGRID_API_KEY'] || '';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3';

interface EmailDraft {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Referral Email Template - HTML
 */
const referralEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Referred to The Zulu Method</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #577AFF 0%, #4A6CF7 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">You've Been Referred!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Join The Zulu Method AI Advisory Board</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; background: #ffffff;">
      <p style="font-size: 18px; margin-bottom: 20px; color: #221E1F;">
        Hi there,
      </p>
      <p style="font-size: 16px; margin-bottom: 20px; color: #595657;">
        <strong style="color: #051A53;">{{referrer_name}}</strong> thinks you'd love <strong>The Zulu Method's AI Customer Advisory Board</strong>!
      </p>
      
      <div style="background: #F9FAFD; border-left: 4px solid #577AFF; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="font-size: 16px; margin: 0; color: #221E1F; font-weight: 600;">
          Get instant feedback from 20 expert AI personas on your products, messaging, pricing, and more.
        </p>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #595657;">
        Run your first report <strong>completely free</strong> and see what your ideal customers really think!
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{referral_link}}" style="background: linear-gradient(135deg, #577AFF 0%, #4A6CF7 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(87, 122, 255, 0.4);">
          Claim Your Free Report →
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px; padding: 20px; background: #F9FAFD; border-radius: 8px;">
        <strong>🎁 Bonus:</strong> This referral link is exclusive to you. When you sign up and become a paying customer, <strong>{{referrer_name}}</strong> will get <strong>1 free month</strong> added to their account!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #F9FAFD; padding: 30px; text-align: center; border-top: 1px solid #EEF2FF;">
      <p style="font-size: 14px; color: #595657; margin: 0 0 10px 0;">
        <strong>The Zulu Method</strong> AI Customer Advisory Board
      </p>
      <p style="font-size: 12px; color: #999; margin: 0;">
        <a href="https://thezulumethod.com" style="color: #577AFF; text-decoration: none;">thezulumethod.com</a> | 
        <a href="{{referral_link}}" style="color: #577AFF; text-decoration: none;">Get Started</a>
      </p>
    </div>
  </div>
  
  <!-- Unsubscribe -->
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">You received this email because {{referrer_name}} referred you to The Zulu Method.</p>
    <p style="margin: 5px 0 0 0;">If you have questions, contact us at <a href="mailto:support@thezulumethod.com" style="color: #577AFF;">support@thezulumethod.com</a></p>
  </div>
</body>
</html>
`;

/**
 * Referral Email Template - Plain Text
 */
const referralEmailText = `
YOU'VE BEEN REFERRED TO THE ZULU METHOD!

Hi there,

{{referrer_name}} thinks you'd love The Zulu Method's AI Customer Advisory Board!

Get instant feedback from 20 expert AI personas on your products, messaging, pricing, and more. Run your first report completely free and see what your ideal customers really think!

🎁 BONUS: This referral link is exclusive to you. When you sign up and become a paying customer, {{referrer_name}} will get 1 free month added to their account!

Claim Your Free Report: {{referral_link}}

---
The Zulu Method AI Customer Advisory Board
https://thezulumethod.com

You received this email because {{referrer_name}} referred you to The Zulu Method.
If you have questions, contact us at support@thezulumethod.com
`;

/**
 * Create email draft in SendGrid
 */
async function createDraft(draft: EmailDraft): Promise<{ success: boolean; templateId?: string; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SENDGRID_API_KEY environment variable is not set' };
  }

  try {
    // Step 1: Create template
    console.log(`Creating template: ${draft.name}...`);
    const templateResponse = await fetch(`${SENDGRID_API_URL}/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: draft.name,
        generation: 'dynamic',
      }),
    });

    if (!templateResponse.ok) {
      const errorText = await templateResponse.text();
      // Check if template already exists
      if (templateResponse.status === 400 && errorText.includes('already exists')) {
        console.log(`Template "${draft.name}" already exists. Fetching existing template...`);
        // Try to find existing template
        const listResponse = await fetch(`${SENDGRID_API_URL}/templates?generations=dynamic`, {
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          },
        });
        const templates = await listResponse.json();
        const existing = templates.templates?.find((t: any) => t.name === draft.name);
        if (existing) {
          console.log(`Found existing template with ID: ${existing.id}`);
          return { success: true, templateId: existing.id };
        }
      }
      return { success: false, error: `Failed to create template: ${errorText}` };
    }

    const template = await templateResponse.json();
    const templateId = template.id;
    console.log(`✅ Template created with ID: ${templateId}`);

    // Step 2: Create template version
    console.log(`Creating template version...`);
    const versionResponse = await fetch(`${SENDGRID_API_URL}/templates/${templateId}/versions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'v1',
        subject: draft.subject,
        html_content: draft.htmlContent,
        plain_content: draft.textContent,
        active: 1,
      }),
    });

    if (!versionResponse.ok) {
      const errorText = await versionResponse.text();
      return { success: false, error: `Failed to create template version: ${errorText}` };
    }

    const version = await versionResponse.json();
    console.log(`✅ Template version created: ${version.id}`);

    return { success: true, templateId };
  } catch (error: any) {
    console.error(`Error creating draft "${draft.name}":`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating SendGrid Email Drafts for Referral System\n');

  if (!SENDGRID_API_KEY) {
    console.error('❌ Error: SENDGRID_API_KEY environment variable is not set');
    console.log('\nPlease set it in your .env file:');
    console.log('SENDGRID_API_KEY=your_sendgrid_api_key_here\n');
    process.exit(1);
  }

  const drafts: EmailDraft[] = [
    {
      name: 'Referral Invitation - The Zulu Method',
      subject: '{{referrer_name}} wants you to try The Zulu Method AI Advisory Board',
      htmlContent: referralEmailHTML,
      textContent: referralEmailText,
    },
  ];

  const results = [];

  for (const draft of drafts) {
    console.log(`\n📧 Processing: ${draft.name}`);
    const result = await createDraft(draft);
    results.push({ draft: draft.name, ...result });
    
    if (result.success) {
      console.log(`✅ Success! Template ID: ${result.templateId}`);
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.draft}: Template ID ${result.templateId}`);
    } else {
      console.log(`❌ ${result.draft}: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} drafts created successfully.`);

  if (successCount > 0) {
    console.log('\n📝 Next Steps:');
    console.log('1. Go to SendGrid Dashboard → Email API → Dynamic Templates');
    console.log('2. Review and edit the templates as needed');
    console.log('3. Update your referral service to use the template IDs');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createDraft, referralEmailHTML, referralEmailText };

