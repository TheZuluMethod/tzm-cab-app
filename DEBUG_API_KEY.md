# Debugging API Key Issues

## Quick Check List

1. **Verify .env file location:**
   - Must be in project root (same folder as `package.json`)
   - File name must be exactly `.env` (not `.env.local`, `.env.development`, etc.)

2. **Verify .env file format:**
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```
   - No spaces around the `=`
   - No quotes around the value
   - No trailing spaces

3. **Check if dev server was restarted:**
   - Vite only loads `.env` on server start
   - Stop server (Ctrl+C) and restart: `npm run dev`

4. **Check browser console:**
   - Look for error messages starting with `❌ GEMINI_API_KEY Error:`
   - This will show what the code is actually seeing

5. **Verify API key is valid:**
   - Should start with `AIzaSy`
   - Should be a long string (usually 39+ characters)
   - Get a new one from: https://aistudio.google.com/apikey

## Common Issues

### Issue: "your_gemini_api_key_here" placeholder
**Fix:** Replace with actual API key

### Issue: API key not loading
**Fix:** 
- Check file is named `.env` (not `.env.txt`)
- Restart dev server
- Check for typos in variable name: `GEMINI_API_KEY` (not `GEMINI_API` or `GEMINI_KEY`)

### Issue: API key appears to load but still errors
**Fix:**
- Check browser console for actual error
- Verify API key hasn't expired
- Try generating a new API key

