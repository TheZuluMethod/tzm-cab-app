# Supabase Setup Guide

This guide will help you set up Supabase for The Zulu Method CAB application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Your project name (e.g., "TZM CAB App")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (this is safe for client-side use)
   - **service_role** key (keep this secret - only for server-side operations)

## Step 3: Set Up Environment Variables

Create a `.env` file in the project root (if it doesn't exist) and add:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Never commit the `.env` file to git (it should already be in `.gitignore`)
- The `anon` key is safe for client-side use
- The `service_role` key should NEVER be used in client-side code

## Step 4: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click "Run" to execute
5. Verify the tables were created:
   - Go to **Table Editor** → You should see `users` and `sessions` tables

## Step 5: Configure OAuth Providers (Optional but Recommended)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for local development)
6. Copy the **Client ID** and **Client Secret**
7. In Supabase: **Authentication** → **Providers** → **Google**
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

### Microsoft/Outlook OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Configure:
   - **Name**: Your app name
   - **Redirect URI**: 
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for local development)
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
4. After creation, note the **Application (client) ID**
5. Go to **Certificates & secrets** → **New client secret**
6. Copy the **Value** (this is your client secret)
7. In Supabase: **Authentication** → **Providers** → **Azure**
   - Enable Azure provider
   - Paste Application (client) ID and Client Secret
   - **Tenant ID**: Use "common" for personal Microsoft accounts
   - Save

## Step 6: Configure Email Templates (Optional)

Supabase provides default email templates, but you can customize them:

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - **Confirm signup** email
   - **Reset password** email
   - **Magic link** email (if using)

## Step 7: Test the Connection

1. Restart your dev server: `npm run dev`
2. The app should now connect to Supabase
3. Try signing up a new user
4. Check Supabase dashboard → **Authentication** → **Users** to see the new user

## Security Features Enabled

✅ **Row Level Security (RLS)**: Users can only access their own data
✅ **Automatic user profile creation**: Profile created when user signs up
✅ **Secure password hashing**: Handled by Supabase Auth
✅ **OAuth integration**: Google and Microsoft sign-in
✅ **Email verification**: Optional email confirmation
✅ **Password reset**: Secure password reset flow

## Troubleshooting

### "Supabase configuration is missing" error
- Check that `.env` file exists and has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables

### OAuth redirect errors
- Make sure redirect URIs match exactly in both Supabase and OAuth provider settings
- Check that OAuth provider is enabled in Supabase dashboard

### RLS policy errors
- Verify the SQL schema was run successfully
- Check **Authentication** → **Policies** in Supabase dashboard
- Ensure policies are enabled for `users` and `sessions` tables

### Database connection errors
- Verify your Supabase project is active (not paused)
- Check that your IP is not blocked (if using IP restrictions)

## Next Steps

After setup is complete:
1. The app will automatically migrate localStorage sessions to Supabase on first login
2. All new sessions will be stored in Supabase
3. Users can access their data from any device after logging in

