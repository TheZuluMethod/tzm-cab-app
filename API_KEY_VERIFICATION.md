# API Key Verification Guide

## Your Current Setup

✅ **API Key Found**: `your_gemini_api_key_here`  
✅ **Project**: TZM AI Customer Advisory Board (tzm-ai-customer-advisory-board)

## How to Verify Your API Key is Correct

### 1. Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project: **TZM AI Customer Advisory Board**
3. Find your API key: `your_gemini_api_key_here`
4. Verify:
   - ✅ **API restrictions**: Should include "Generative Language API" (Gemini API)
   - ✅ **Application restrictions**: Set appropriately (None, HTTP referrers, or IP addresses)
   - ✅ **Status**: Should be "Enabled"

### 2. Check API Usage & Quotas

1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Select your project: **TZM AI Customer Advisory Board**
3. Check:
   - **Requests per day**: Should show your paid plan limits
   - **Requests per minute**: Should show your rate limits
   - **Current usage**: Should show how much you've used

### 3. Verify in Your App

1. **Restart your dev server** (if you haven't already):
   ```bash
   npm run dev
   ```

2. **Check the browser console** (F12):
   - Look for: `✅ Gemini client initialized successfully`
   - If you see errors, check the detailed error object

3. **Check the terminal** when starting the server:
   - Should see: `[Vite Config] GEMINI_API_KEY found: your_api_key... (placeholder: false)`

## Common Issues

### Issue: API Key Not Being Read
**Solution**: Make sure you restarted the dev server after updating `.env`

### Issue: Wrong Project
**Solution**: The API key works across projects, but make sure:
- The key is enabled for "Generative Language API"
- The key has the right quotas/permissions

### Issue: Rate Limit vs Quota Error
- **Rate Limit**: Too many requests per minute (temporary, wait a bit)
- **Quota**: Daily limit reached (check your usage dashboard)

## Next Steps

1. ✅ Verify your API key in Google Cloud Console
2. ✅ Check your API quotas and usage
3. ✅ Restart your dev server
4. ✅ Test the app and check browser console for detailed errors

The error messages should now be more accurate and help identify the exact issue!

