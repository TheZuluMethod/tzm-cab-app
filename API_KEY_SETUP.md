# API Key Setup Instructions

## Current Issue

Your `.env` file currently has a placeholder value:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## How to Fix

1. **Get your Gemini API Key:**
   - Go to https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Create a new API key or use an existing one

2. **Update your `.env` file:**
   - Open the `.env` file in the project root
   - Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

3. **Restart the dev server:**
   - Stop the current dev server (Ctrl+C)
   - Start it again: `npm run dev`
   - **Important:** Vite only loads `.env` files when the server starts, so you MUST restart

## Verify It's Working

After restarting, the app should work without the API key error. If you still see errors:
- Check the browser console for detailed error messages
- Verify the API key is correct (starts with `AIzaSy`)
- Make sure there are no extra spaces or quotes around the key in `.env`
- Ensure the `.env` file is in the project root (same folder as `package.json`)

## Example .env File

```
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

