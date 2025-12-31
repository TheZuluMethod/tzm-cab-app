# SendGrid Email Setup for Referral System

## Overview

This document explains how to set up SendGrid for sending referral invitation emails.

## Prerequisites

1. A SendGrid account (sign up at https://sendgrid.com)
2. A verified sender email address in SendGrid
3. A SendGrid API key with "Mail Send" permissions

## Step 1: Get Your SendGrid API Key

1. Log in to your SendGrid account
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `TZM CAB Referral System`
5. Select **Full Access** or at minimum:
   - **Mail Send** (required)
   - **Template Engine** (required for drafts)
6. Click **Create & View**
7. **Copy the API key immediately** - you won't be able to see it again!

## Step 2: Verify Your Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form:
   - **From Email**: `noreply@thezulumethod.com` (or your preferred email)
   - **From Name**: `The Zulu Method`
   - **Reply To**: `support@thezulumethod.com`
   - **Company Address**: Your company address
4. Click **Create**
5. Check your email and click the verification link

## Step 3: Create Email Drafts in SendGrid

### Option A: Use the Script (Recommended)

1. Add your SendGrid API key to your `.env` file:
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```

2. Install dependencies (if needed):
   ```bash
   npm install tsx dotenv
   ```

3. Run the script:
   ```bash
   npx tsx scripts/create-sendgrid-drafts.ts
   ```

4. The script will create a dynamic template called "Referral Invitation - The Zulu Method"

5. Note the Template ID from the output

### Option B: Create Manually in SendGrid Dashboard

1. Go to **Email API** → **Dynamic Templates**
2. Click **Create a Dynamic Template**
3. Name it: `Referral Invitation - The Zulu Method`
4. Click **Add Version**
5. Choose **Code Editor**
6. Set **Subject**: `{{referrer_name}} wants you to try The Zulu Method AI Advisory Board`
7. Paste the HTML content from `scripts/create-sendgrid-drafts.ts` (the `referralEmailHTML` variable)
8. Paste the plain text content from `scripts/create-sendgrid-drafts.ts` (the `referralEmailText` variable)
9. Click **Save**
10. Copy the **Template ID** from the template page

## Step 4: Configure Environment Variables

Add these to your `.env` file:

```env
# SendGrid Configuration
VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here
VITE_SENDGRID_REFERRAL_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: The `VITE_` prefix is required for Vite to expose these variables to the frontend.

## Step 5: Update Supabase Edge Function (If Using Backend)

If you want to send emails from a Supabase Edge Function instead of the frontend:

1. Go to Supabase Dashboard → **Edge Functions** → **Secrets**
2. Add:
   - `SENDGRID_API_KEY` = Your SendGrid API key
   - `SENDGRID_REFERRAL_TEMPLATE_ID` = Your template ID

## Step 6: Test the Integration

1. Open your app and go to **Account** → **Refer Colleagues**
2. Enter a test email address
3. Click **Send Referrals**
4. Check the test email inbox for the referral invitation

## Email Template Variables

The referral email template uses these dynamic variables:

- `{{referrer_name}}` - Name of the person making the referral
- `{{referral_link}}` - The unique referral link

These are automatically populated when sending emails.

## Troubleshooting

### "Failed to send email" Error

1. Check that `VITE_SENDGRID_API_KEY` is set correctly
2. Verify your sender email is verified in SendGrid
3. Check SendGrid Activity Feed for delivery status
4. Ensure your API key has "Mail Send" permissions

### Template Not Found

1. Verify `VITE_SENDGRID_REFERRAL_TEMPLATE_ID` matches your template ID
2. Ensure the template is set to "Active" in SendGrid
3. Check that the template uses "Dynamic" generation type

### Emails Going to Spam

1. Set up SPF, DKIM, and DMARC records for your domain
2. Use SendGrid's **Domain Authentication** instead of single sender
3. Warm up your IP address gradually if using a dedicated IP

## Email Content Customization

To edit the email content:

1. Go to SendGrid Dashboard → **Email API** → **Dynamic Templates**
2. Find your template and click **Edit**
3. Modify the HTML and text content
4. Click **Save**

Or edit `scripts/create-sendgrid-drafts.ts` and re-run the script (it will update existing templates).

## Security Notes

- **Never commit API keys to Git** - always use environment variables
- Use different API keys for development and production
- Rotate API keys periodically
- Monitor SendGrid Activity Feed for suspicious activity

## Next Steps

Once SendGrid is configured:

1. Test sending referral emails
2. Monitor SendGrid Activity Feed for delivery rates
3. Set up bounce/complaint handling if needed
4. Consider setting up webhooks for delivery tracking

