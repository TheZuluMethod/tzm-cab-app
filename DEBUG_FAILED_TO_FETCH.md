# Debugging "Failed to Fetch" Error - Complete Guide

## 🔍 Root Cause Analysis

The "Failed to fetch" error occurs when the frontend tries to call the Supabase Edge Function `create-checkout-session`. This is a network-level error that can have several causes.

---

## 📋 Step-by-Step Debugging Checklist

### Step 1: Verify Edge Function is Deployed

**Check in Supabase Dashboard:**
1. Go to: Supabase Dashboard → Edge Functions
2. Look for `create-checkout-session` function
3. Verify it shows as "Active" or "Deployed"
4. If missing or shows errors, you need to deploy it

**Deploy Command:**
```bash
supabase functions deploy create-checkout-session
```

**OR manually in Dashboard:**
1. Go to Edge Functions → Create Function
2. Name: `create-checkout-session`
3. Copy code from `supabase/functions/create-checkout-session/index.ts`
4. Deploy

---

### Step 2: Verify Edge Function URL is Correct

**Check the URL being called:**
- Open browser DevTools (F12)
- Go to Network tab
- Click "Upgrade Now" button
- Look for failed request to `/functions/v1/create-checkout-session`
- Check the full URL - it should be: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session`

**Verify in code:**
- File: `services/stripeService.ts`
- Line 64: Should use `import.meta.env['VITE_SUPABASE_URL']`
- Check `.env` file has correct `VITE_SUPABASE_URL`

---

### Step 3: Check Environment Variables

**Frontend (.env file):**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_ID=price_xxxxx
```

**Backend (Supabase Edge Functions Secrets):**
- Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
- Verify these exist:
  - `STRIPE_SECRET_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SITE_URL` (optional but recommended)

---

### Step 4: Check Browser Console for Detailed Errors

**Open DevTools (F12) → Console tab:**
- Look for any red error messages
- Common errors:
  - `CORS policy` → CORS issue (shouldn't happen with Supabase)
  - `NetworkError` → Function not deployed or wrong URL
  - `401 Unauthorized` → Missing or invalid auth token
  - `404 Not Found` → Function not deployed or wrong URL
  - `500 Internal Server Error` → Function crashed (check logs)

---

### Step 5: Check Edge Function Logs

**In Supabase Dashboard:**
1. Go to: Edge Functions → `create-checkout-session` → Logs
2. Look for error messages
3. Common errors:
   - `STRIPE_SECRET_KEY environment variable is not set` → Missing secret
   - `No authorization header` → Auth token not sent
   - `Unauthorized` → Invalid auth token
   - `Price ID is required` → Missing priceId in request body

---

### Step 6: Test Edge Function Directly

**Using curl (PowerShell):**
```powershell
# Get your auth token first (from browser DevTools → Application → Local Storage → supabase.auth.token)
$authToken = "YOUR_AUTH_TOKEN_HERE"
$supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co"
$anonKey = "YOUR_ANON_KEY_HERE"
$priceId = "YOUR_PRICE_ID_HERE"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $authToken"
    "apikey" = $anonKey
}

$body = @{
    priceId = $priceId
} | ConvertTo-Json

Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/create-checkout-session" -Method Post -Headers $headers -Body $body
```

**Expected Response:**
```json
{
  "sessionId": "cs_test_xxxxx"
}
```

**If you get an error, note the exact error message.**

---

### Step 7: Verify Authentication

**Check if user is authenticated:**
- Open browser DevTools → Application → Local Storage
- Look for `supabase.auth.token`
- If missing, user is not logged in
- Try logging out and back in

**Check in code:**
- File: `services/stripeService.ts`
- Line 52-55: Checks for auth session
- If no session, throws "User not authenticated"

---

### Step 8: Check Network Request Details

**In Browser DevTools → Network tab:**
1. Click "Upgrade Now" button
2. Find the failed request to `create-checkout-session`
3. Click on it to see details:
   - **Request URL**: Should match your Supabase URL
   - **Request Method**: Should be `POST`
   - **Request Headers**: Should include:
     - `Authorization: Bearer <token>`
     - `apikey: <anon_key>`
     - `Content-Type: application/json`
   - **Request Payload**: Should include `{"priceId": "price_xxxxx"}`
   - **Status Code**: Note the exact status code
   - **Response**: Click "Response" tab to see error message

---

## 🐛 Common Issues & Solutions

### Issue 1: Function Not Deployed
**Symptom**: 404 Not Found or NetworkError  
**Solution**: Deploy the function using Supabase CLI or Dashboard

### Issue 2: Missing Environment Variables
**Symptom**: 500 Internal Server Error with message about missing env var  
**Solution**: Add missing secrets to Supabase Edge Functions secrets

### Issue 3: Wrong URL
**Symptom**: NetworkError or CORS error  
**Solution**: Verify `VITE_SUPABASE_URL` in `.env` matches your Supabase project URL

### Issue 4: Missing Auth Token
**Symptom**: 401 Unauthorized  
**Solution**: User needs to log in, or token expired (refresh page)

### Issue 5: CORS Error
**Symptom**: CORS policy error in console  
**Solution**: Shouldn't happen with Supabase, but check Edge Function CORS headers

### Issue 6: Function Crashed
**Symptom**: 500 Internal Server Error  
**Solution**: Check Edge Function logs for error details, fix code, redeploy

---

## 🔧 Quick Fixes to Try

### Fix 1: Restart Dev Server
```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 2: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### Fix 3: Verify .env File
- Check `.env` file exists in project root
- Verify all `VITE_` variables are present
- Restart dev server after changing `.env`

### Fix 4: Check Supabase Project Status
- Go to Supabase Dashboard
- Verify project is active (not paused)
- Check for any service alerts

---

## 📝 Enhanced Error Logging

I'll add better error logging to help debug. Check the browser console after clicking "Upgrade Now" - you should see detailed error messages.

---

## ✅ Next Steps

1. **Check Edge Function Logs** (Most Important!)
   - Go to Supabase Dashboard → Edge Functions → `create-checkout-session` → Logs
   - Look for errors when you click "Upgrade Now"
   - Share the error message if you see one

2. **Check Browser Console**
   - Open DevTools (F12) → Console
   - Click "Upgrade Now"
   - Look for any error messages
   - Share the error message

3. **Check Network Tab**
   - Open DevTools (F12) → Network
   - Click "Upgrade Now"
   - Find the failed request
   - Check Status Code and Response
   - Share the details

4. **Verify Function is Deployed**
   - Go to Supabase Dashboard → Edge Functions
   - Confirm `create-checkout-session` exists and is active

---

## 🚨 If Still Not Working

Share these details:
1. Error message from browser console
2. Error message from Edge Function logs
3. Status code from Network tab
4. Screenshot of Edge Functions page showing deployed functions
5. Screenshot of Edge Functions secrets page (blur out actual values)

