# "Failed to Fetch" Error - Fix Summary

## 🐛 Bug Found & Fixed

**Issue**: Response format mismatch between Edge Function and frontend code.

- **Edge Function returns**: `{ sessionId: "cs_test_xxxxx" }`
- **Frontend was expecting**: `{ id: "cs_test_xxxxx" }`

**Fix Applied**: Updated `services/stripeService.ts` to correctly parse `sessionId` from the response.

---

## ✅ Enhanced Error Logging Added

Added comprehensive logging to help debug future issues:

1. **Pre-request logging**: Logs URL, priceId, auth status
2. **Network error handling**: Catches and logs "Failed to fetch" errors with details
3. **Response logging**: Logs status codes and response data
4. **Error details**: Logs full error objects with stack traces

**To see logs**: Open browser DevTools (F12) → Console tab → Click "Upgrade Now"

---

## 🔍 Next Steps to Debug

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Click "Upgrade Now" button
4. Look for logs starting with `[Stripe]`
5. Share any error messages you see

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Upgrade Now" button
4. Find the request to `create-checkout-session`
5. Check:
   - **Status Code** (should be 200)
   - **Request URL** (should match your Supabase URL)
   - **Response** tab (if error, copy the error message)

### Step 3: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → `create-checkout-session` → Logs
3. Click "Upgrade Now" in your app
4. Check for new log entries
5. Share any error messages

### Step 4: Verify Edge Function is Deployed
1. Go to Supabase Dashboard → Edge Functions
2. Verify `create-checkout-session` exists and shows as "Active"
3. If missing, deploy it:
   ```bash
   supabase functions deploy create-checkout-session
   ```

### Step 5: Verify Environment Variables

**Frontend (.env file):**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_ID=price_xxxxx
```

**Backend (Supabase Edge Functions Secrets):**
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL` (optional)

---

## 🚨 Common Issues & Solutions

### Issue 1: Edge Function Not Deployed
**Symptom**: NetworkError or 404 in console  
**Solution**: Deploy the function in Supabase Dashboard or via CLI

### Issue 2: Missing Environment Variables
**Symptom**: Error message about missing env var  
**Solution**: Add missing variables to `.env` (frontend) or Supabase secrets (backend)

### Issue 3: Wrong Supabase URL
**Symptom**: NetworkError or CORS error  
**Solution**: Verify `VITE_SUPABASE_URL` matches your project URL exactly

### Issue 4: User Not Authenticated
**Symptom**: "User not authenticated" error  
**Solution**: Log out and log back in, or refresh the page

### Issue 5: Edge Function Crashed
**Symptom**: 500 Internal Server Error  
**Solution**: Check Edge Function logs for error details, fix code, redeploy

---

## 📝 What to Share for Further Debugging

If the issue persists, please share:

1. **Browser Console Output**:
   - Copy all `[Stripe]` log messages
   - Copy any red error messages

2. **Network Tab Details**:
   - Status code of the failed request
   - Response body (if any)
   - Request URL

3. **Edge Function Logs**:
   - Copy any error messages from Supabase Dashboard → Edge Functions → Logs

4. **Environment Check**:
   - Confirm Edge Function is deployed (screenshot of Edge Functions page)
   - Confirm secrets are set (don't share actual values, just confirm they exist)

---

## ✅ Testing After Fix

1. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Test upgrade flow**:
   - Click "Upgrade Now" button
   - Check browser console for `[Stripe]` logs
   - Verify no "Failed to fetch" error
   - If error persists, check logs and share details

---

## 🎯 Expected Behavior

After clicking "Upgrade Now":

1. Console should show:
   ```
   🔍 [Stripe] Starting checkout session creation...
   ✅ [Stripe] Supabase URL: https://xxxxx.supabase.co
   ✅ [Stripe] User authenticated: { userId: "..." }
   ✅ [Stripe] Price ID: price_xxxxx
   🔗 [Stripe] Calling Edge Function: https://xxxxx.supabase.co/functions/v1/create-checkout-session
   📡 [Stripe] Response status: 200 OK
   ✅ [Stripe] Response data: { sessionId: "cs_test_xxxxx" }
   ✅ [Stripe] Checkout session created successfully: { sessionId: "cs_test_xxxxx" }
   ```

2. Browser should redirect to Stripe Checkout page

3. If error occurs, console will show detailed error message with troubleshooting info

