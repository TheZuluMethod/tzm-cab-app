# Error Reporting Service Setup

## ✅ Error Reporting Service Installed

A comprehensive error reporting service has been integrated that automatically emails breaking errors to **hbrett@thezulumethod.com**.

## 📧 Email Configuration

The service supports two email methods (in order of preference):

### Option 1: SendGrid (Recommended)

Add to your `.env` file:
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
ERROR_REPORT_FROM_EMAIL=errors@thezulumethod.com
```

**To get a SendGrid API key:**
1. Sign up at https://sendgrid.com
2. Go to Settings > API Keys
3. Create a new API key with "Mail Send" permissions
4. Add the key to your `.env` file

### Option 2: SMTP (Alternative)

Add to your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ERROR_REPORT_FROM_EMAIL=errors@thezulumethod.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

## 🎯 What Gets Reported

The service automatically reports:
- ✅ React component errors (via Error Boundary)
- ✅ Unhandled promise rejections
- ✅ Global JavaScript errors
- ✅ API call failures
- ✅ Board generation errors
- ✅ Analysis streaming errors
- ✅ Member regeneration errors

## 📋 Email Content

Each error email includes:

### Subject Line
```
TZM CAB App Breaking Error!
```

### Email Body Contains:
1. **Error Details**
   - Error name and message
   - Error code (if available)
   - Full stack trace

2. **Context Information**
   - Timestamp
   - Application state when error occurred
   - User input context (industry, feedback type, etc.)
   - User agent and URL
   - Session ID for tracking

3. **Suggested Fixes**
   - Context-aware suggestions based on error type
   - Specific recommendations for:
     - API errors
     - Network issues
     - Authentication problems
     - Rate limits
     - Memory issues
     - Parsing errors
     - Component errors
     - File upload issues

## 🔧 How It Works

### Error Detection
1. **React Error Boundary**: Catches component errors
2. **Try-Catch Blocks**: Catches async errors in handlers
3. **Global Handlers**: Catches unhandled errors and promise rejections

### Error Reporting Flow
```
Error Occurs
    ↓
Capture Error + Context
    ↓
Generate Suggestions
    ↓
Format Error Report
    ↓
Send Email (SendGrid → SMTP → Console)
    ↓
Log to Console (for development)
```

## 🛡️ Error Boundary

The app is wrapped in an Error Boundary that:
- Catches React component errors
- Displays user-friendly error message
- Automatically reports the error
- Provides "Reload Page" option

## 📊 Error Context Captured

For each error, the service captures:
- **Application State**: What screen/user was on
- **User Input**: Industry, feedback type, file uploads
- **Browser Info**: User agent, URL
- **Session ID**: Unique ID for tracking related errors
- **Timestamp**: Exact time of error

## 🎨 User Experience

### When an Error Occurs:
1. User sees a friendly error message
2. Error is automatically reported via email
3. User can reload the page to continue
4. No sensitive data is exposed to users

### Error Boundary UI:
- Clean, professional error screen
- Clear messaging that error was reported
- Simple "Reload Page" button

## 🔍 Monitoring

### Console Logs
Check browser console for:
```
✅ Error report sent via SendGrid
🚨 Breaking error reported: { error details }
```

### Email Notifications
You'll receive emails at **hbrett@thezulumethod.com** with:
- Complete error information
- Stack traces
- Context and suggestions
- Session tracking

## ⚙️ Configuration

### Environment Variables

**Required for SendGrid:**
- `SENDGRID_API_KEY`

**Required for SMTP:**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

**Optional:**
- `ERROR_REPORT_FROM_EMAIL` (defaults to errors@thezulumethod.com)

### Fallback Behavior

If email is not configured:
- Errors are logged to console
- App continues to function normally
- No email is sent (but error is still logged)

## 🚀 Testing

To test the error reporting:

1. **Temporarily break something** (e.g., remove an API key)
2. **Trigger an error** (e.g., try to generate a board)
3. **Check your email** at hbrett@thezulumethod.com
4. **Check console** for error logs

## 📝 Error Report Format

Example email structure:
```
🚨 BREAKING ERROR DETECTED 🚨

═══════════════════════════════════════════════════════════════
ERROR DETAILS
═══════════════════════════════════════════════════════════════

Error Name: TypeError
Error Message: Cannot read property 'map' of undefined
Error Code: undefined

═══════════════════════════════════════════════════════════════
STACK TRACE
═══════════════════════════════════════════════════════════════

[Full stack trace...]

═══════════════════════════════════════════════════════════════
CONTEXT INFORMATION
═══════════════════════════════════════════════════════════════

Timestamp: 2024-11-23T22:45:30.543Z
Application State: ANALYZING
User Input Context:
  - Industry: B2B SaaS
  - Feedback Type: Product or Feature Idea
  - Has Files: No
User Agent: Mozilla/5.0...
URL: http://localhost:3000
Session ID: session_1234567890_abc123

═══════════════════════════════════════════════════════════════
SUGGESTED FIXES
═══════════════════════════════════════════════════════════════

1. Check that API keys are properly configured in .env file
2. Verify API key permissions and rate limits
3. Check network connectivity and API service status
...

═══════════════════════════════════════════════════════════════
END OF ERROR REPORT
═══════════════════════════════════════════════════════════════
```

## 🔒 Privacy & Security

- **No sensitive user data** is included in error reports
- Only error information and context are sent
- Session IDs are randomly generated (not tied to users)
- Email is sent securely via SendGrid or SMTP

## ✅ Status

**Error Reporting Service**: ✅ Active
**Email Recipient**: hbrett@thezulumethod.com
**Subject Line**: "TZM CAB App Breaking Error!"

---

**Next Steps:**
1. Configure SendGrid or SMTP in `.env` file
2. Test error reporting by triggering an error
3. Verify emails are received at hbrett@thezulumethod.com

