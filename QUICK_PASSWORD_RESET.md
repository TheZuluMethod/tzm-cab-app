# Quick Password Reset Guide

## 🚨 Can't Remember Your Password?

No problem! Here are the fastest ways to reset it:

---

## ✅ **FASTEST: Use Supabase Dashboard**

1. **Go to:** https://supabase.com/dashboard
2. **Log in** with your Supabase account (the one you use to manage the project)
3. **Navigate to:** Authentication → Users
4. **Find:** `hbrett@thezulumethod.com`
5. **Click:** Three dots (⋮) → **"Send password reset email"**
6. **Check email** and click the reset link
7. **Set new password**

**That's it!** You'll be able to log in with your new password.

---

## 🔧 **Alternative: Direct Password Update**

If the email doesn't work:

1. In Supabase Dashboard → Authentication → Users
2. Click **"Edit User"** (pencil icon) next to your email
3. Scroll to **"Password"** section
4. Click **"Set Password"** or **"Reset Password"**
5. Enter new password directly
6. Click **"Save"**

---

## 💻 **Using the Reset Script (Advanced)**

If you have your Supabase Service Role Key:

1. **Get Service Role Key:**
   - Supabase Dashboard → Settings → API
   - Copy the **"service_role"** key

2. **Edit `reset-admin-password.js`:**
   - Update `SERVICE_ROLE_KEY` with your key
   - Update `NEW_PASSWORD` with your desired password

3. **Run the script:**
   ```bash
   node reset-admin-password.js
   ```

4. **Log in** with your new password

---

## ❓ **Can't Access Supabase Dashboard?**

If you can't log into Supabase Dashboard either:

1. **Reset Supabase account password first:**
   - Go to: https://supabase.com/auth/reset-password
   - Enter your Supabase account email
   - Reset that password

2. **Then follow the steps above** to reset your app password

---

## 🆘 **Still Stuck?**

Let me know and I can:
- Help you find your Supabase account email
- Guide you through the Dashboard step-by-step
- Create a different reset method

**The Supabase Dashboard method (Option 1) is the easiest and most reliable!**

