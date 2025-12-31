# Supabase Quick Start Guide

Your Supabase project is now configured! Follow these steps to complete the setup.

## ✅ Step 1: Environment Variables (DONE)
Your `.env` file has been configured with:
- ✅ `VITE_SUPABASE_URL=https://rhbxbrzvefllzqfuzdwb.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY=sb_publishable_jh_xbjNtf6upKj4P6F5oLg_U2hE-oMJ`

## 📋 Step 2: Run Database Schema

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb
2. **Navigate to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Open the file**: `supabase/schema.sql` from this project
5. **Copy the entire SQL** from that file
6. **Paste into the SQL Editor**
7. **Click "Run"** (or press Ctrl+Enter)

You should see:
- ✅ Tables created: `users` and `sessions`
- ✅ RLS policies enabled
- ✅ Triggers created
- ✅ Functions created

## 🔍 Step 3: Verify Tables Created

1. In Supabase Dashboard, go to **Table Editor** (left sidebar)
2. You should see:
   - `users` table
   - `sessions` table

## 🚀 Step 4: Test the App

1. **Restart your dev server** (if it's running):
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser (usually http://localhost:5173)

3. **You should see**:
   - Login/Signup screen (if not authenticated)
   - Or the main app (if you're already logged in)

4. **Test signup**:
   - Click "Sign up"
   - Create a test account
   - You should be redirected to the app

5. **Test session storage**:
   - Complete a board session
   - Check Supabase Dashboard → Table Editor → `sessions` table
   - You should see your session data

## 🔐 Step 5: Configure OAuth (Optional)

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google+ API**
4. Create OAuth 2.0 Client ID
5. Add redirect URI: `https://rhbxbrzvefllzqfuzdwb.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret
7. In Supabase: **Authentication** → **Providers** → **Google** → Enable and paste credentials

### Microsoft OAuth Setup:
1. Go to [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Add redirect URI: `https://rhbxbrzvefllzqfuzdwb.supabase.co/auth/v1/callback`
4. Copy Application (client) ID and create a client secret
5. In Supabase: **Authentication** → **Providers** → **Azure** → Enable and paste credentials

## 🐛 Troubleshooting

### "Supabase configuration is missing" error
- ✅ Check `.env` file exists and has correct variables
- ✅ Restart dev server after adding variables
- ✅ Variables must start with `VITE_` for Vite

### "relation does not exist" error
- ✅ Make sure you ran the SQL schema in Supabase SQL Editor
- ✅ Check Table Editor to verify tables exist

### Authentication not working
- ✅ Check Supabase project is active (not paused)
- ✅ Verify email templates in **Authentication** → **Email Templates**
- ✅ Check browser console for errors

### Sessions not saving
- ✅ Verify RLS policies are enabled (should be automatic from schema)
- ✅ Check browser console for errors
- ✅ Verify user is authenticated (check AuthWrapper)

## 📊 Check Your Data

After creating sessions, you can view them in:
- **Supabase Dashboard** → **Table Editor** → `sessions` table
- **App UI** → Click "Saved Reports" button

## 🎉 You're All Set!

Once the schema is run, your app is ready to use with Supabase backend!

---

**Next**: Run the SQL schema in Supabase Dashboard, then restart your dev server and test!

