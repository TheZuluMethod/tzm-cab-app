# Admin Panel Setup Guide

The Admin Panel has been added to the user dropdown menu. Here's what you need to know:

## ✅ What's Been Added

1. **User Dropdown Menu** - Replaces the separate user info and sign out buttons
   - Located next to the user email in the header
   - Contains: Admin, Saved Reports, Sign Out

2. **Admin Panel** - Modal for managing users
   - Add new users with email, name, and avatar
   - Upload profile pictures
   - Form validation and error handling

## ⚠️ Important: Admin User Creation Limitation

The Admin Panel uses `supabase.auth.admin.createUser()` which **requires the service role key**. 

**Security Note**: The service role key should NEVER be exposed in frontend code. It has full admin access to your Supabase project.

### Current Status
- ✅ UI is fully functional
- ⚠️ User creation requires backend API or manual setup

### Options for User Creation

#### Option 1: Backend API (Recommended for Production)
Create a backend API endpoint that:
1. Authenticates the admin user
2. Uses the service role key server-side
3. Creates users via `supabase.auth.admin.createUser()`

#### Option 2: Manual Creation (For Testing)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and set password
4. User will be created and can sign in

#### Option 3: Temporary Frontend Solution (Development Only)
If you need to test the admin panel immediately, you can temporarily:
1. Add service role key to `.env` as `VITE_SUPABASE_SERVICE_ROLE_KEY` (NOT RECOMMENDED)
2. Update `supabaseClient.ts` to use service role key for admin operations
3. **Remove before production deployment**

## 📋 Setup Steps

### 1. Run Storage Setup SQL (For Avatar Uploads)

Run `supabase/storage-setup.sql` in Supabase SQL Editor to create the avatars storage bucket:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

Then set up storage policies (see `supabase/storage-setup.sql` for full SQL).

### 2. Test the UI

1. Sign in to the app
2. Click on your email in the header (dropdown will open)
3. Click "Admin"
4. Try filling out the form (user creation will show an error until backend is set up)

## 🔒 Security Recommendations

For production:
1. **Never expose service role key** in frontend code
2. Create a backend API endpoint for admin operations
3. Add admin role checking (only allow certain users to access admin panel)
4. Add rate limiting to prevent abuse
5. Add audit logging for admin actions

## 🎨 UI Features

- ✅ Dropdown menu with smooth animations
- ✅ Admin panel modal with form validation
- ✅ Avatar upload with preview
- ✅ Error and success messaging
- ✅ Responsive design

## 📝 Next Steps

1. Set up backend API for user creation (recommended)
2. Add admin role checking
3. Add user list/view functionality
4. Add user edit/delete functionality
5. Add audit logging

---

**Note**: The Admin Panel UI is complete and ready to use. User creation functionality requires backend setup for security.

