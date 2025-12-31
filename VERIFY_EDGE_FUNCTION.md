# Verify Edge Function Deployment

## ✅ Your URL Format is Correct!

Your Supabase project reference ID: `rhbxbrzvefllzqfuzdwb`  
Edge Function URL: `https://rhbxbrzvefllzqfuzdwb.supabase.co/functions/v1/create-checkout-session`

The format is **100% correct**. The issue is that the function needs to be deployed.

---

## 🔍 Step 1: Check if Function is Deployed

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/rhbxbrzvefllzqfuzdwb

2. **Navigate to Edge Functions**:
   - Left sidebar → **Edge Functions**

3. **Look for `create-checkout-session`**:
   - ✅ If you see it listed → Function exists, check if it's active
   - ❌ If you DON'T see it → Function is not deployed (this is the problem!)

---

## 🚀 Step 2: Deploy the Function

### Option A: Using Supabase Dashboard (Easiest)

1. In Supabase Dashboard → **Edge Functions**
2. Click **"Create a new function"** or **"New Function"**
3. **Function name**: `create-checkout-session` (must match exactly)
4. **Copy the code** from: `supabase/functions/create-checkout-session/index.ts`
5. **Paste into the function editor**
6. Click **"Deploy"** or **"Save"**

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref rhbxbrzvefllzqfuzdwb

# Deploy the function
supabase functions deploy create-checkout-session
```

---

## 🔐 Step 3: Verify Secrets are Set

After deploying, make sure these secrets are configured:

1. **Go to**: Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. **Verify these exist**:
   - ✅ `STRIPE_SECRET_KEY` (your Stripe secret key)
   - ✅ `SUPABASE_URL` (should be: `https://rhbxbrzvefllzqfuzdwb.supabase.co`)
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` (found in Settings → API → service_role key)
   - ✅ `SITE_URL` (optional, but recommended: `http://localhost:5173` for dev)

---

## 🧪 Step 4: Test the Function

After deploying, test it:

1. **Open browser DevTools** (F12) → **Console**
2. **Click "Upgrade Now"** button
3. **Check console logs** - you should see:
   ```
   🔍 [Stripe] Starting checkout session creation...
   ✅ [Stripe] Supabase URL: https://rhbxbrzvefllzqfuzdwb.supabase.co
   🔗 [Stripe] Calling Edge Function: https://rhbxbrzvefllzqfuzdwb.supabase.co/functions/v1/create-checkout-session
   📡 [Stripe] Response status: 200 OK
   ```

4. **If you still get "Failed to fetch"**:
   - Check Edge Function logs: Dashboard → Edge Functions → `create-checkout-session` → **Logs**
   - Look for error messages
   - Share the error message

---

## 📋 Quick Checklist

- [ ] Edge Function `create-checkout-session` exists in Supabase Dashboard
- [ ] Edge Function shows as "Active" or "Deployed"
- [ ] All required secrets are set (STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Tested the function and checked logs

---

## 🚨 Most Likely Issue

**The Edge Function is not deployed.** This is why you're getting "Failed to fetch" - the URL is correct, but there's nothing at that endpoint to respond.

**Solution**: Deploy the function using one of the methods above.

