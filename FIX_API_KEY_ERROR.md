# Fix API Key Error - Step by Step

## The Problem

Your `.env` file currently has:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

This is a **placeholder**, not a real API key.

## Solution - Follow These Steps Exactly:

### Step 1: Get Your Real Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key" or use an existing one
4. Copy the API key (it will look like: `AIzaSy...` followed by a long string)

### Step 2: Update Your .env File

1. Open the `.env` file in the project root folder
2. Find this line:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```
4. **Important:** 
   - No spaces around the `=`
   - No quotes around the value
   - Save the file

### Step 3: Restart the Dev Server

**This is critical!** Vite only reads `.env` files when the server starts.

1. Stop your current dev server:
   - Press `Ctrl+C` in the terminal where it's running
   - Wait for it to fully stop

2. Start it again:
   ```bash
   npm run dev
   ```

3. Wait for the server to fully start (you'll see "Local: http://localhost:3000")

### Step 4: Verify It's Working

1. Open the browser console (F12)
2. Look for: `✅ Gemini client initialized successfully`
3. If you see `❌ GEMINI_API_KEY Error:`, check the details shown

## Still Not Working?

### Check Browser Console

Open browser console (F12) and look for:
- `❌ GEMINI_API_KEY Error:` - This shows what the code sees
- Check the values shown in the error object

### Verify .env File

1. Make sure the file is named exactly `.env` (not `.env.txt` or `.env.local`)
2. Make sure it's in the project root (same folder as `package.json`)
3. Check for typos: `GEMINI_API_KEY` (not `GEMINI_API` or `GEMINI_KEY`)

### Check Vite Console

When you start the dev server, you should see in the terminal:
```
[Vite Config] GEMINI_API_KEY found: AIzaSy... (placeholder: false)
```

If you see `placeholder: true`, the API key wasn't updated correctly.

## Need Help?

If it's still not working after following these steps:
1. Check the browser console for the exact error message
2. Check the terminal where `npm run dev` is running for any messages
3. Verify your API key is valid at https://aistudio.google.com/apikey

