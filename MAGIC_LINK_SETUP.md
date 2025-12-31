# Magic Link Login Setup

## ✅ What's Been Added

Magic link (passwordless) login has been added to your app! Users can now:

1. **Choose between Password or Magic Link** login
2. **Enter their email** and receive a magic link
3. **Click the link** in their email to sign in instantly
4. **No password required** - secure and convenient!

---

## 🎨 UI Features

### Login Form Updates:
- ✅ Toggle between "Password" and "Magic Link" modes
- ✅ Magic link form with email input
- ✅ Success message after sending magic link
- ✅ "Back to password login" option
- ✅ Loading states and error handling

---

## 🔧 Supabase Configuration

### Step 1: Configure Email Redirect URL

1. **Go to**: Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Set Redirect URLs**:
   - **Site URL**: `http://localhost:5173` (for dev) or your production URL
   - **Redirect URLs**: Add:
     - `http://localhost:5173/auth/callback`
     - `https://your-domain.com/auth/callback` (for production)

### Step 2: Configure Email Templates (Optional)

1. **Go to**: Supabase Dashboard → **Authentication** → **Email Templates**
2. **Customize** the "Magic Link" template:
   - Add your branding
   - Customize the email content
   - Set the redirect URL

### Step 3: Enable Magic Link Authentication

Magic link is enabled by default in Supabase. Verify:

1. **Go to**: Supabase Dashboard → **Authentication** → **Providers**
2. **Email** provider should be enabled
3. **Confirm email** can be disabled for magic links (optional)

---

## 🚀 How It Works

### User Flow:

1. **User clicks "Magic Link"** tab on login form
2. **Enters email** address
3. **Clicks "Send Magic Link"**
4. **Receives email** with login link
5. **Clicks link** → Automatically signed in
6. **Redirected** to app

### Technical Flow:

1. Frontend calls `sendMagicLink(email)`
2. Supabase sends email with magic link
3. User clicks link → Redirects to `/auth/callback`
4. `AuthWrapper` detects callback and handles authentication
5. User is automatically signed in

---

## 📝 Code Changes

### Added Functions (`services/authService.ts`):
- `sendMagicLink(email)` - Sends magic link email
- `verifyMagicLink(token, type)` - Verifies magic link token

### Updated Components:
- `components/Auth/LoginForm.tsx` - Added magic link UI
- `components/Auth/AuthWrapper.tsx` - Handles magic link callbacks

---

## ✅ Testing

### Test Magic Link Flow:

1. **Open login form**
2. **Click "Magic Link"** tab
3. **Enter your email**
4. **Click "Send Magic Link"**
5. **Check your email** for the magic link
6. **Click the link** in the email
7. **Should automatically sign in**

### Expected Behavior:

- ✅ Success message appears after sending
- ✅ Email received within seconds
- ✅ Clicking link signs user in automatically
- ✅ User redirected to app

---

## 🐛 Troubleshooting

### Issue: Email not received
- **Check spam folder**
- **Verify email address is correct**
- **Check Supabase logs**: Dashboard → Authentication → Logs

### Issue: Link doesn't work
- **Verify redirect URL** is configured in Supabase
- **Check URL format** matches exactly
- **Ensure link hasn't expired** (default: 1 hour)

### Issue: "Invalid token" error
- **Link may have expired** - request a new one
- **Check Supabase logs** for specific error
- **Verify redirect URL** configuration

---

## 🔐 Security Notes

- Magic links expire after 1 hour (default)
- Links are single-use (can't be reused)
- Tokens are cryptographically secure
- Email verification ensures user owns the email

---

## 🎯 Next Steps

1. **Test the magic link flow** end-to-end
2. **Customize email template** in Supabase (optional)
3. **Set production redirect URLs** before launch
4. **Monitor email delivery** in Supabase logs

---

## 📚 Additional Resources

- [Supabase Magic Link Docs](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)

