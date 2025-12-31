# Fix 401 Unauthorized Error

## ✅ Good News!

The **401 error** means your Edge Function **IS deployed** and responding! The issue is authentication.

---

## 🔧 Quick Fix Steps

### Step 1: Add SUPABASE_ANON_KEY Secret

The Edge Function needs the anon key to verify auth tokens properly.

1. **Go to**: Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. **Add new secret**:
   - **Name**: `SUPABASE_ANON_KEY`
   - **Value**: Your anon key (found in Settings → API → anon public key)
   - Click **Save**

### Step 2: Update Edge Function Code

1. **Go to**: Supabase Dashboard → **Edge Functions** → `create-checkout-session`
2. **Click**: Edit/Update function
3. **Copy** the updated code from: `EDGE_FUNCTION_CODE_TO_COPY.txt`
4. **Paste** into the function editor
5. **Click**: Deploy/Save

### Step 3: Test Again

1. **Refresh your browser** (to get a fresh auth token)
2. **Click "Upgrade Now"** button
3. **Check console** for `[Stripe]` logs
4. **Check Edge Function logs** in Supabase Dashboard

---

## 🔍 What Changed

The updated Edge Function:
- ✅ Uses `SUPABASE_ANON_KEY` for auth verification (more reliable)
- ✅ Falls back to `apikey` header if secret not set
- ✅ Adds better error logging to help debug
- ✅ Validates token format before verification

---

## 🚨 If Still Getting 401

### Check 1: User Session
1. **Log out** of your app
2. **Log back in**
3. **Try "Upgrade Now"** again

### Check 2: Edge Function Logs
1. Go to: Supabase Dashboard → **Edge Functions** → `create-checkout-session` → **Logs**
2. Click "Upgrade Now" in your app
3. Check for error messages:
   - `No authorization header` → Token not being sent
   - `Invalid token format` → Token malformed
   - `Auth verification error: ...` → Specific auth error

### Check 3: Browser Console
1. Open DevTools (F12) → **Console**
2. Look for `[Stripe]` logs
3. Check if you see: `✅ [Stripe] User authenticated: { userId: "..." }`
   - ✅ If YES → Token is valid, issue is in Edge Function
   - ❌ If NO → User not authenticated, log out/in

### Check 4: Network Tab
1. Open DevTools (F12) → **Network**
2. Click "Upgrade Now"
3. Find request to `create-checkout-session`
4. Check **Request Headers**:
   - ✅ Should have: `Authorization: Bearer eyJ...`
   - ✅ Should have: `apikey: eyJ...`

---

## 📋 Required Secrets Checklist

Make sure these are set in Supabase Edge Functions secrets:

- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `SUPABASE_URL` - `https://rhbxbrzvefllzqfuzdwb.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from Settings → API)
- [ ] `SUPABASE_ANON_KEY` - **NEW!** Anon key (from Settings → API)
- [ ] `SITE_URL` - `http://localhost:5173` (for dev)

---

## ✅ Expected Behavior After Fix

When working correctly:

1. **Browser Console**:
   ```
   ✅ [Stripe] User authenticated: { userId: "..." }
   🔗 [Stripe] Calling Edge Function: ...
   📡 [Stripe] Response status: 200 OK
   ✅ [Stripe] Checkout session created successfully
   ```

2. **Browser redirects** to Stripe Checkout page

3. **Edge Function Logs** show:
   ```
   User authenticated: <user-id> <user-email>
   ```

---

## 🎯 Most Likely Issue

The Edge Function needs `SUPABASE_ANON_KEY` secret to verify auth tokens properly. Add it and redeploy the function with the updated code.

