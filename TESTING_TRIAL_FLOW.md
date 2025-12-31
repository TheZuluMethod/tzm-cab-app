# Testing the Trial Flow - Step by Step Guide

## ✅ Yes, the complete flow is built and ready!

You can easily test the trial experience by logging out and creating a new test user account.

## Step-by-Step Testing Process

### 1. **Log Out as Admin**
   - Click on your user dropdown (top right corner)
   - Click **"Sign Out"**
   - The app will reload and show the login/signup screen

### 2. **Create a New Test User**
   - On the login screen, click **"Sign up"** or **"Create an account"**
   - Fill in:
     - **Email**: Use a test email (e.g., `testuser@example.com`)
     - **Password**: Must be at least 8 characters with uppercase, lowercase, and a number
     - **Full Name** (optional)
   - Click **"Sign Up"**
   - **Note**: If email confirmation is enabled in Supabase, you may need to check your email and confirm the account

### 3. **Automatic Trial Creation**
   - When a new user signs up, a **trial subscription is automatically created** via database trigger
   - The new user will have:
     - `status: 'trialing'`
     - `reports_limit: 1`
     - `reports_used: 0`
     - `reports_remaining: 1`

### 4. **Test the Trial Experience**
   - You'll see the welcome screen with a **"Free Trial Active"** banner
   - Click **"Assemble My Board"** to start
   - Complete one full report (ICP Setup → Setup Form → Board Assembly → Analysis)
   - After completing the report, you'll see:
     - The trial nag modal popup (if you navigate back to welcome screen)
     - Trial status showing 0 reports remaining

### 5. **Test the Upgrade Flow**
   - When trial is complete, the **Trial Nag Modal** will appear
   - Click **"Unlock As Many Reports As You Need"** to test the upgrade flow
   - This will redirect to Stripe Checkout (use test mode)

### 6. **Log Back In as Admin**
   - Click **"Sign Out"** from the test user account
   - Log back in with your admin credentials (`hbrett@thezulumethod.com`)
   - You'll be back to your admin account with full access

## What Happens Automatically

### ✅ Trial Subscription Creation
When a new user signs up, the database trigger `handle_new_user_signup()` automatically:
- Creates a subscription record with `status: 'trialing'`
- Sets `reports_limit: 1` (one free report)
- Sets `reports_used: 0`
- Sets trial end date to 30 days from signup
- Logs a `trial_started` event

### ✅ Trial Status Display
- **Welcome Screen**: Shows trial status banner
- **After Report Completion**: Shows trial nag modal
- **User Dropdown**: Can check subscription status

### ✅ Trial Enforcement
- Users cannot start a new report if `reports_remaining === 0`
- Upgrade screen appears when trying to start a report with no reports remaining
- Trial nag modal appears when navigating to welcome screen after trial completion

## Quick Test Checklist

- [ ] Log out as admin
- [ ] Sign up as new test user
- [ ] Verify trial banner appears on welcome screen
- [ ] Complete one full report
- [ ] Verify trial nag modal appears
- [ ] Test upgrade flow (will redirect to Stripe)
- [ ] Log back in as admin

## Troubleshooting

### If trial subscription isn't created automatically:
1. Check Supabase Dashboard → Database → Functions
2. Verify `handle_new_user_signup()` trigger exists
3. Check `subscriptions` table for the new user's record

### If email confirmation is required:
- Check Supabase Dashboard → Authentication → Settings
- You can disable email confirmation for testing, or check your email inbox

### To reset a test user's trial:
Run this SQL in Supabase SQL Editor:
```sql
UPDATE subscriptions 
SET reports_used = 0, 
    reports_limit = 1, 
    status = 'trialing'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testuser@example.com');
```

## Notes

- **Test users**: You can create multiple test accounts with different emails
- **Trial reset**: You can manually reset trials via SQL if needed for testing
- **Stripe test mode**: Use Stripe test cards when testing the upgrade flow
- **Admin access**: Your admin account (`hbrett@thezulumethod.com`) is in the `admin_users` table and has special access

