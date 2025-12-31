# Fix 401 Unauthorized Error

## 🔍 What 401 Means

A **401 Unauthorized** error means:
- ✅ Edge Function is deployed and responding
- ❌ Authentication is failing

The Edge Function is rejecting the request because it can't verify the user is authenticated.

---

## 🐛 Common Causes

### 1. User Not Logged In
**Symptom**: User session expired or user logged out  
**Fix**: Log out and log back in, or refresh the page

### 2. Auth Token Not Being Sent
**Symptom**: Authorization header missing  
**Fix**: Check browser DevTools → Network → Request Headers

### 3. Invalid Auth Token
**Symptom**: Token expired or corrupted  
**Fix**: Clear browser storage and log in again

### 4. Edge Function Auth Check Failing
**Symptom**: Token is sent but Supabase can't verify it  
**Fix**: Check Edge Function logs for specific error

---

## 🔧 Step-by-Step Fix

### Step 1: Check Browser Console

1. Open DevTools (F12) → **Console** tab
2. Look for `[Stripe]` logs
3. Check if you see:
   ```
   ✅ [Stripe] User authenticated: { userId: "..." }
   ```
   - ✅ If YES → Token is being sent, issue is in Edge Function
   - ❌ If NO → User not authenticated, need to log in

### Step 2: Check Network Request

1. Open DevTools (F12) → **Network** tab
2. Click "Upgrade Now" button
3. Find request to `create-checkout-session`
4. Click on it → **Headers** tab
5. Check **Request Headers**:
   - ✅ Should have: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ✅ Should have: `apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ❌ If missing → Auth token not being sent

### Step 3: Check Edge Function Logs

1. Go to: Supabase Dashboard → **Edge Functions** → `create-checkout-session` → **Logs**
2. Click "Upgrade Now" in your app
3. Check for new log entries
4. Look for error messages like:
   - `No authorization header`
   - `Unauthorized`
   - `authError: ...`

### Step 4: Verify User is Authenticated

1. In your app, check if you're logged in
2. Try logging out and logging back in
3. Refresh the page
4. Check browser → Application → Local Storage → `supabase.auth.token`

---

## 🚨 Quick Fixes to Try

### Fix 1: Refresh Auth Session
```javascript
// In browser console (F12)
// This will refresh your auth token
location.reload()
```

### Fix 2: Log Out and Back In
1. Click "Sign Out" in your app
2. Log back in
3. Try "Upgrade Now" again

### Fix 3: Clear Browser Storage
1. Open DevTools (F12) → **Application** tab
2. **Local Storage** → Your domain
3. Delete `supabase.auth.token`
4. Refresh page and log in again

### Fix 4: Check Edge Function Code

Make sure the Edge Function is checking auth correctly. The function should:
1. Get `Authorization` header
2. Extract token
3. Call `supabase.auth.getUser(token)`
4. Verify user exists

---

## 🔍 Debugging Steps

### Check 1: Is User Authenticated?
Open browser console and run:
```javascript
// Check if user is logged in
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

If `session` is `null`, user is not authenticated.

### Check 2: Is Token Being Sent?
In Network tab, check the request headers for:
- `Authorization: Bearer ...`
- `apikey: ...`

### Check 3: Edge Function Logs
Check Supabase Dashboard → Edge Functions → Logs for:
- `No authorization header` → Token not sent
- `Unauthorized` → Token invalid or expired
- `authError: ...` → Specific auth error

---

## ✅ Expected Behavior

When working correctly:

1. **Browser Console**:
   ```
   ✅ [Stripe] User authenticated: { userId: "..." }
   🔗 [Stripe] Calling Edge Function: ...
   📡 [Stripe] Response status: 200 OK
   ```

2. **Network Tab**:
   - Status: `200 OK`
   - Response: `{ "sessionId": "cs_test_xxxxx" }`

3. **Edge Function Logs**:
   - No errors
   - Request processed successfully

---

## 🎯 Most Likely Issue

Based on the 401 error, the most common causes are:

1. **User session expired** → Log out and back in
2. **Auth token not in request** → Check Network tab headers
3. **Edge Function auth check failing** → Check Edge Function logs

---

## 📝 Next Steps

1. **Check browser console** for `[Stripe]` logs
2. **Check Network tab** for Authorization header
3. **Check Edge Function logs** in Supabase Dashboard
4. **Try logging out and back in**
5. **Share the specific error** from Edge Function logs

The 401 error is progress - it means the function is deployed! We just need to fix the authentication.

