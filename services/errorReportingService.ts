/**
 * Error Reporting Service
 * 
 * Automatically emails breaking errors to the development team.
 * Captures comprehensive error information including stack traces,
 * context, and suggested fixes.
 * 
 * Features:
 * - Automatic error detection and reporting
 * - Multiple email delivery methods (SendGrid, SMTP, fallback)
 * - Context-aware error suggestions
 * - Session tracking for error correlation
 * - Graceful degradation if email services unavailable
 * 
 * @module services/errorReportingService
 */

/**
 * Extended error interface for capturing additional error metadata
 */
interface ExtendedError extends Error {
  code?: string | number;
  statusCode?: number;
  retryDelay?: number;
}

/**
 * User input context for error reporting
 */
interface UserInputContext {
  industry?: string;
  feedbackType?: string;
  hasFiles?: boolean;
}

/**
 * Error context information captured with each error report
 */
interface ErrorContext {
  appState?: string;
  userInput?: UserInputContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
  sessionId?: string;
}

interface ErrorReport {
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: ErrorContext;
  suggestions: string[];
}

/**
 * Generate contextual suggestions based on error type and context
 * 
 * Analyzes error messages and context to provide actionable debugging suggestions.
 * Helps developers quickly identify and resolve common issues.
 * 
 * @param error - The error object to analyze
 * @param context - Additional context about when/where the error occurred
 * @returns Array of actionable suggestion strings
 * @internal
 */
const generateSuggestions = (error: Error, _context: ErrorContext): string[] => {
  const suggestions: string[] = [];
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // API-related errors
  if (errorMessage.includes('api') || errorMessage.includes('key') || errorName.includes('api')) {
    suggestions.push('Check that API keys are properly configured in .env file');
    suggestions.push('Verify API key permissions and rate limits');
    suggestions.push('Check network connectivity and API service status');
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    suggestions.push('Check internet connection');
    suggestions.push('Verify API endpoints are accessible');
    suggestions.push('Check for firewall or proxy issues');
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    suggestions.push('Verify API keys are correct and not expired');
    suggestions.push('Check API key permissions');
    suggestions.push('Review authentication configuration');
  }

  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('quota')) {
    suggestions.push('API rate limit exceeded - wait before retrying');
    suggestions.push('Consider upgrading API plan if limits are too low');
    suggestions.push('Implement request throttling or caching');
  }

  // Memory errors
  if (errorMessage.includes('memory') || errorMessage.includes('out of memory')) {
    suggestions.push('Check available system memory');
    suggestions.push('Review data processing for memory leaks');
    suggestions.push('Consider processing data in smaller batches');
  }

  // Parsing/JSON errors
  if (errorMessage.includes('json') || errorMessage.includes('parse') || errorName.includes('syntax')) {
    suggestions.push('Check API response format matches expected structure');
    suggestions.push('Verify data validation before parsing');
    suggestions.push('Review error handling for malformed responses');
  }

  // Component/React errors
  if (errorMessage.includes('component') || errorMessage.includes('react') || errorName.includes('react')) {
    suggestions.push('Check component props and state management');
    suggestions.push('Verify all required dependencies are installed');
    suggestions.push('Review React component lifecycle and hooks usage');
  }

  // File upload errors
  if (errorMessage.includes('file') || errorMessage.includes('upload')) {
    suggestions.push('Check file size limits and formats');
    suggestions.push('Verify file upload service configuration');
    suggestions.push('Review file validation logic');
  }

  // Generic suggestions if no specific match
  if (suggestions.length === 0) {
    suggestions.push('Review error stack trace for specific failure point');
    suggestions.push('Check application logs for additional context');
    suggestions.push('Verify all environment variables are set correctly');
    suggestions.push('Check browser console for additional error details');
  }

  return suggestions;
};

/**
 * Format error report as a human-readable email body
 * 
 * Creates a structured, easy-to-read error report with sections for
 * error details, stack trace, context, and suggested fixes.
 * 
 * @param report - The error report to format
 * @returns Formatted email body string
 * @internal
 */
const formatErrorReport = (report: ErrorReport): string => {
  const { error, context, suggestions } = report;

  return `
🚨 BREAKING ERROR DETECTED 🚨

═══════════════════════════════════════════════════════════════
ERROR DETAILS
═══════════════════════════════════════════════════════════════

Error Name: ${error.name}
Error Message: ${error.message}
${error.code ? `Error Code: ${error.code}` : ''}

═══════════════════════════════════════════════════════════════
STACK TRACE
═══════════════════════════════════════════════════════════════

${error.stack || 'No stack trace available'}

═══════════════════════════════════════════════════════════════
CONTEXT INFORMATION
═══════════════════════════════════════════════════════════════

Timestamp: ${context.timestamp}
Application State: ${context.appState || 'Unknown'}
${context.userInput ? `
User Input Context:
  - Industry: ${context.userInput.industry || 'Not provided'}
  - Feedback Type: ${context.userInput.feedbackType || 'Not provided'}
  - Has Files: ${context.userInput.hasFiles ? 'Yes' : 'No'}
` : ''}
${context.userAgent ? `User Agent: ${context.userAgent}` : ''}
${context.url ? `URL: ${context.url}` : ''}
${context.sessionId ? `Session ID: ${context.sessionId}` : ''}

═══════════════════════════════════════════════════════════════
SUGGESTED FIXES
═══════════════════════════════════════════════════════════════

${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}

═══════════════════════════════════════════════════════════════
END OF ERROR REPORT
═══════════════════════════════════════════════════════════════
`;
};

/**
 * Send error report via email with multiple fallback methods
 * 
 * Attempts to send error reports in order of preference:
 * 1. SendGrid API (most reliable)
 * 2. SMTP (nodemailer)
 * 3. Console logging (fallback)
 * 
 * Never throws errors - gracefully degrades to console logging if all methods fail.
 * 
 * @param report - The error report to send
 * @returns Promise that resolves when email is sent or fallback completes
 * @internal
 */
const sendErrorEmail = async (report: ErrorReport): Promise<void> => {
  const emailBody = formatErrorReport(report);
  const recipient = 'hbrett@thezulumethod.com';
  const subject = 'TZM CAB App Breaking Error!';

  try {
    // Try SendGrid first (most reliable)
    const sendGridApiKey = process.env['SENDGRID_API_KEY'];
    if (sendGridApiKey && sendGridApiKey !== 'undefined' && sendGridApiKey !== '') {
      try {
        await sendViaSendGrid(recipient, subject, emailBody, sendGridApiKey);
        console.log('✅ Error report sent via SendGrid');
        return;
      } catch (sendGridError) {
        console.warn('SendGrid failed, trying SMTP fallback:', sendGridError);
        // Fall through to SMTP
      }
    }

    // Fallback to SMTP if SendGrid not configured or failed
    const smtpHost = process.env['SMTP_HOST'];
    const smtpPort = process.env['SMTP_PORT'];
    const smtpSecure = process.env['SMTP_SECURE'];
    const smtpUser = process.env['SMTP_USER'];
    const smtpPass = process.env['SMTP_PASS'];

    if (smtpHost && smtpHost !== 'undefined' && 
        smtpUser && smtpUser !== 'undefined' && 
        smtpPass && smtpPass !== 'undefined') {
      const smtpConfig = {
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpSecure === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      };
      try {
        await sendViaSMTP(recipient, subject, emailBody, smtpConfig);
        console.log('✅ Error report sent via SMTP');
        return;
      } catch (smtpError) {
        console.warn('SMTP failed:', smtpError);
        // Fall through to console logging
      }
    }

    // Last resort: Log to console AND try to send via a simple HTTP endpoint if available
    console.error('⚠️ Email service not configured. Error report:');
    console.error(emailBody);
    console.error('\n📧 To enable email reporting, configure SENDGRID_API_KEY or SMTP settings in .env');
    
    // Also try to send via a simple POST to a potential error reporting endpoint
    // This allows for a server-side endpoint to handle emails if needed
    try {
      await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body: emailBody, recipient })
      }).catch(() => {
        // Ignore fetch errors - endpoint may not exist
      });
    } catch {
      // Ignore - this is just a fallback attempt
    }

  } catch (error) {
    // Don't let email failures break the app
    console.error('Failed to send error email:', error);
    console.error('Error report that failed to send:');
    console.error(emailBody);
  }
};

/**
 * Send email via SendGrid API
 * 
 * Uses SendGrid's REST API v3 for reliable email delivery.
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param body - Email body content
 * @param apiKey - SendGrid API key
 * @returns Promise that resolves on success
 * @throws Error if SendGrid API call fails
 * @internal
 */
const sendViaSendGrid = async (
  to: string,
  subject: string,
  body: string,
  apiKey: string
): Promise<void> => {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }]
        }],
        from: {
          email: (process.env['ERROR_REPORT_FROM_EMAIL'] && process.env['ERROR_REPORT_FROM_EMAIL'] !== 'undefined') 
            ? process.env['ERROR_REPORT_FROM_EMAIL'] 
            : 'errors@thezulumethod.com',
          name: 'TZM CAB App Error Reporter'
        },
        subject: subject,
        content: [{
          type: 'text/plain',
          value: body
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    // If SendGrid fails, try SMTP fallback
    throw error;
  }
};

/**
 * Send email via SMTP using nodemailer
 * 
 * Dynamically imports nodemailer if available and sends email via SMTP.
 * Used as fallback when SendGrid is unavailable.
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param body - Email body content
 * @param config - SMTP configuration object
 * @returns Promise that resolves on success
 * @throws Error if SMTP send fails or nodemailer unavailable
 * @internal
 */
const sendViaSMTP = async (
  to: string,
  subject: string,
  body: string,
  config: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  }
): Promise<void> => {
  try {
    // Try to use nodemailer if available
    const nodemailer = await import('nodemailer').catch(() => null);
    
    if (nodemailer) {
      const transporter = nodemailer.default.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth
      });

      await transporter.sendMail({
        from: process.env['ERROR_REPORT_FROM_EMAIL'] || 'errors@thezulumethod.com',
        to: to,
        subject: subject,
        text: body
      });
    } else {
      throw new Error('Nodemailer not available');
    }
  } catch (error) {
    throw new Error(`SMTP send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a unique session ID for error tracking
 * 
 * Creates a timestamped, random session identifier for correlating
 * multiple errors from the same user session.
 * 
 * @returns Unique session ID string
 * @internal
 */
const generateSessionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session_${timestamp}_${random}`;
};

/**
 * Report a breaking error to the development team
 * 
 * Captures comprehensive error information and sends it via email.
 * Never throws errors - gracefully handles failures to prevent breaking the app.
 * 
 * @param error - The error object to report
 * @param context - Additional context about when/where the error occurred
 * @returns Promise that resolves when error is reported (or fallback completes)
 * 
 * @example
 * ```typescript
 * try {
 *   // Some operation
 * } catch (error) {
 *   await reportError(error, {
 *     appState: 'UserAction',
 *     sessionId: getOrCreateSessionId()
 *   });
 * }
 * ```
 */
export const reportError = async (
  error: Error,
  context: Partial<ErrorContext> = {}
): Promise<void> => {
  try {
    // Build full context with defaults
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: context.sessionId ?? generateSessionId(),
      ...context
    };

    // Generate contextual suggestions
    const suggestions = generateSuggestions(error, fullContext);

    // Create structured error report
    const extendedError = error as ExtendedError;
    const report: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: extendedError.code ? String(extendedError.code) : undefined
      },
      context: fullContext,
      suggestions
    };

    // Send email report (non-blocking, with fallbacks)
    await sendErrorEmail(report);

    // Log to console for development/debugging
    console.error('🚨 Breaking error reported:', {
      name: error.name,
      message: error.message,
      context: fullContext
    });

  } catch (reportingError) {
    // Never let error reporting break the app
    console.error('Failed to report error:', reportingError);
    console.error('Original error:', error);
  }
};

/**
 * Get or create a persistent session ID for error tracking
 * 
 * Retrieves existing session ID from localStorage, or creates a new one
 * if none exists. Session IDs persist across page reloads to enable
 * error correlation within the same user session.
 * 
 * @returns Session ID string
 * 
 * @example
 * ```typescript
 * const sessionId = getOrCreateSessionId();
 * await reportError(error, { sessionId });
 * ```
 */
export const getOrCreateSessionId = (): string => {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  const STORAGE_KEY = 'tzm_cab_session_id';
  
  try {
    const existingSessionId = localStorage.getItem(STORAGE_KEY);
    
    if (existingSessionId && existingSessionId.trim().length > 0) {
      return existingSessionId;
    }
    
    // Create and store new session ID
    const newSessionId = generateSessionId();
    localStorage.setItem(STORAGE_KEY, newSessionId);
    return newSessionId;
    
  } catch (storageError) {
    // localStorage may be disabled or unavailable
    console.warn('Failed to access localStorage for session ID:', storageError);
    return generateSessionId();
  }
};

