# Reset Admin Password - Step by Step Guide

## Option 1: Reset Password via Supabase Dashboard (Easiest)

### Steps:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Log in with your Supabase account (not your app account)

2. **Navigate to Users:**
   - Select your project
   - Go to **Authentication** → **Users**
   - Find the user with email: `hbrett@thezulumethod.com`

3. **Reset Password:**
   - Click the **three dots (⋮)** next to your user
   - Select **"Send password reset email"**
   - Check your email inbox for the reset link
   - Click the link and set a new password

### If "Send password reset email" doesn't work:

1. Click **"Edit User"** (pencil icon)
2. Scroll down to **"Password"** section
3. Click **"Reset Password"** or **"Set Password"**
4. Enter a new password directly
5. Click **"Save"**

---

## Option 2: Reset Password via SQL (If you have database access)

If you have access to the Supabase SQL Editor, you can reset the password directly:

### Steps:

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run this SQL query:**

```sql
-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'hbrett@thezulumethod.com';

-- Then reset the password (replace YOUR_NEW_PASSWORD with your desired password)
-- Note: Supabase requires you to use their auth.update_user() function
-- This is best done via the Dashboard or API, not direct SQL
```

**Important:** Supabase doesn't allow direct password updates via SQL for security reasons. You must use the Dashboard or API.

---

## Option 3: Use Supabase API to Reset Password

If you have the Supabase Service Role Key, you can reset it programmatically:

### Steps:

1. **Get your Service Role Key:**
   - Supabase Dashboard → **Settings** → **API**
   - Copy the **"service_role"** key (keep it secret!)

2. **Use this script** (run in browser console or Node.js):

```javascript
// Replace these values:
const SUPABASE_URL = 'https://rhbxbrzvefllzqfuzdwb.supabase.co';
const SERVICE_ROLE_KEY = 'your_service_role_key_here';
const USER_EMAIL = 'hbrett@thezulumethod.com';
const NEW_PASSWORD = 'YourNewSecurePassword123!';

// Reset password
fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'GET',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
})
.then(res => res.json())
.then(users => {
  const user = users.find(u => u.email === USER_EMAIL);
  if (!user) {
    console.error('User not found');
    return;
  }
  
  return fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: NEW_PASSWORD,
    }),
  });
})
.then(res => res.json())
.then(data => {
  console.log('Password reset successful!', data);
})
.catch(err => {
  console.error('Error:', err);
});
```

---

## Option 4: Create a Temporary Admin Reset Script

I can create a simple script you can run locally to reset your password. Would you like me to create this?

---

## Recommended: Use Option 1 (Supabase Dashboard)

The easiest and safest way is to use the Supabase Dashboard:

1. Log in to https://supabase.com/dashboard
2. Go to Authentication → Users
3. Find your user and click "Send password reset email"
4. Check your email and follow the link

---

## If You Can't Access Supabase Dashboard

If you can't log into Supabase Dashboard either, you'll need to:

1. **Reset your Supabase account password first:**
   - Go to https://supabase.com/auth/reset-password
   - Enter the email associated with your Supabase account
   - Reset that password first

2. **Then follow Option 1 above** to reset your app password

---

## Need More Help?

Let me know which option you'd like to try, and I can guide you through it step by step!

