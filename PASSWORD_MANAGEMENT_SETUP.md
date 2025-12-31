# Password Management Setup Guide

## ✅ Implementation Complete

Password management has been added to the Account Panel with branded email templates.

## Features Added

### 1. **Password Change in Account Panel** ✅
- Users can change their password from the Account Panel
- Requires current password verification
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Show/hide password toggle for all password fields
- Success confirmation with email notification

### 2. **Branded Email Templates** ✅
- **Password Reset Email**: Branded template for forgotten password requests
- **Password Change Confirmation**: Branded template sent when password is updated

## Setup Instructions

### Step 1: Configure Email Templates in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Email Templates**
3. Configure the following templates:

#### **Password Reset Template**

1. Click on **"Reset Password"** template
2. Copy the HTML from `supabase/email-templates/password-reset.html`
3. Paste it into the template editor
4. Update the template variables:
   - `{{ .ConfirmationURL }}` - Supabase will automatically replace this
   - `{{ .SiteURL }}` - Replace with your site URL (e.g., `https://yourdomain.com`)

**Subject Line:**
```
Reset Your Password - The Zulu Method
```

#### **Password Change Confirmation (via Edge Function)**

Password change confirmation emails are sent via a Supabase Edge Function (see Step 3 below). The template is built into the function and uses SendGrid for delivery.

### Step 2: Configure Email Settings

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Set **Site URL**: Your app's URL (e.g., `https://yourdomain.com`)
3. Set **Redirect URLs**: Add your reset password URL:
   ```
   https://yourdomain.com/reset-password
   ```
4. Configure **SMTP Settings** (if using custom SMTP):
   - Go to **Project Settings** → **Auth** → **SMTP Settings**
   - Enter your SMTP credentials
   - Or use Supabase's default email service

### Step 3: Set Up Password Change Email Function

#### Option A: Using SendGrid (Recommended)

1. **Deploy the Edge Function:**
   - Copy the code from `supabase/functions/send-password-change-email/index.ts`
   - In Supabase Dashboard → **Edge Functions** → **Create a new function**
   - Name it: `send-password-change-email`
   - Paste the code and deploy

2. **Set Supabase Secrets:**
   - Go to **Settings** → **Edge Functions** → **Secrets**
   - Add:
     - `SENDGRID_API_KEY` = Your SendGrid API key
     - `PASSWORD_CHANGE_FROM_EMAIL` = `noreply@thezulumethod.com` (or your email)
     - `SITE_URL` = Your site URL (e.g., `https://yourdomain.com`)

3. **Run Database Migration:**
   - Run `supabase/migrations/add_password_change_email_trigger.sql` in Supabase SQL Editor
   - This creates the `password_changes` table and logging function

#### Option B: Using Supabase Default Email (Alternative)

If you don't want to use SendGrid, you can modify the Edge Function to use Supabase's built-in email service or SMTP.

### Step 3: Test Password Management

1. **Test Password Change:**
   - Log in to your account
   - Open Account Panel
   - Click "Change Password"
   - Enter current password and new password
   - Verify confirmation email is received

2. **Test Password Reset:**
   - Log out
   - Click "Forgot Password" on login screen
   - Enter your email
   - Check email for reset link
   - Click link and set new password

## Email Template Variables

Supabase provides these variables in email templates:

- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Reset token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Site URL from settings
- `{{ .RedirectTo }}` - Redirect URL after reset

## Custom Email Service (Optional)

If you want more control over email templates, you can:

1. **Use SendGrid** (recommended):
   - Set up SendGrid account
   - Configure SMTP in Supabase
   - Use SendGrid templates for more customization

2. **Use Database Triggers**:
   - Create a trigger on password updates
   - Send custom email via Edge Function or external service

## Code Changes Made

### Files Modified:

1. **`services/authService.ts`**:
   - Added `changePassword()` function
   - Updated `resetPassword()` with email template notes

2. **`components/AccountPanel.tsx`**:
   - Added password change section
   - Added show/hide password toggles
   - Added password validation
   - Added success/error handling

### Files Created:

1. **`supabase/email-templates/password-reset.html`**:
   - Branded password reset email template

2. **`supabase/email-templates/password-change-confirmation.html`**:
   - Branded password change confirmation template

## Security Features

✅ **Current Password Verification**: Users must enter current password
✅ **Password Strength Validation**: Enforces strong passwords
✅ **Email Confirmation**: Sends confirmation email on password change
✅ **Secure Password Reset**: Uses Supabase's secure reset flow
✅ **Password Visibility Toggle**: Users can verify passwords while typing

## Testing Checklist

- [ ] Password change works from Account Panel
- [ ] Current password verification works
- [ ] Password strength validation works
- [ ] Password reset email is received
- [ ] Password reset link works
- [ ] Password change confirmation email is received (if configured)
- [ ] Show/hide password toggles work
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## Troubleshooting

### Email Not Sending

1. Check Supabase Dashboard → **Authentication** → **Logs**
2. Verify SMTP settings are configured
3. Check spam folder
4. Verify email templates are saved correctly

### Password Change Not Working

1. Verify current password is correct
2. Check browser console for errors
3. Verify Supabase connection is working
4. Check network tab for API errors

### Email Templates Not Rendering

1. Verify template variables are correct
2. Check Supabase template syntax
3. Test with simple HTML first
4. Verify template is saved and active

## Next Steps

1. Configure email templates in Supabase Dashboard
2. Test password change flow
3. Test password reset flow
4. Verify branded emails are received
5. Customize email templates as needed

All code changes are complete! Just configure the email templates in Supabase Dashboard.

---

## ✅ Summary

### What's Been Implemented:

1. ✅ **Password Change UI** - Added to Account Panel with:
   - Current password verification
   - New password input with strength validation
   - Confirm password field
   - Show/hide password toggles
   - Success/error messaging

2. ✅ **Password Change Function** - Added `changePassword()` to authService:
   - Verifies current password before allowing change
   - Updates password securely via Supabase
   - Logs password changes to database
   - Triggers confirmation email

3. ✅ **Branded Email Templates**:
   - Password reset email (for Supabase Dashboard)
   - Password change confirmation (via Edge Function)

4. ✅ **Database Logging**:
   - `password_changes` table for audit trail
   - Tracks IP address, user agent, timestamp

5. ✅ **Edge Function**:
   - `send-password-change-email` function ready to deploy
   - Uses SendGrid for branded email delivery

### What You Need to Configure:

1. 📋 **Supabase Email Templates**:
   - Copy password reset template to Supabase Dashboard
   - Configure template variables

2. 📋 **Deploy Edge Function**:
   - Deploy `send-password-change-email` function
   - Set SendGrid API key in secrets

3. 📋 **Run Database Migration**:
   - Run `add_password_change_email_trigger.sql`

4. 📋 **Test**:
   - Test password change from Account Panel
   - Verify emails are received

**Everything is ready to use once you configure the email templates and Edge Function!**

