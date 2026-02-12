/**
 * Application Entry Point
 * 
 * Initializes React application with comprehensive error handling.
 * Sets up global error handlers for uncaught errors and promise rejections.
 * 
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import AuthWrapper from './components/Auth/AuthWrapper';
import { ThemeProvider } from './contexts/ThemeContext';
import { reportError, getOrCreateSessionId } from './services/errorReportingService';
import { getFaviconUrl } from './services/faviconService';

/**
 * Global error handler for uncaught JavaScript errors
 * 
 * Catches all unhandled errors and reports them to the development team.
 * Provides comprehensive error context including stack traces and location.
 */
window.addEventListener('error', (event: ErrorEvent) => {
  console.error('🚨 Global Error Handler caught:', {
    message: event.message,
    filename: event.filename ?? 'unknown',
    lineno: event.lineno ?? 0,
    colno: event.colno ?? 0,
    error: event.error,
    stack: event.error?.stack
  });
  
  if (event.error) {
    reportError(event.error, {
      appState: 'GlobalErrorHandler',
      sessionId: getOrCreateSessionId()
    }).catch((err) => {
      console.error('Failed to report global error:', err);
    });
  }
});

/**
 * Global handler for unhandled promise rejections
 * 
 * Catches promise rejections that aren't handled with .catch()
 * and reports them as errors.
 */
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('🚨 Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Convert rejection reason to Error object if needed
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  
  reportError(error, {
    appState: 'UnhandledRejection',
    sessionId: getOrCreateSessionId()
  }).catch((err) => {
    console.error('Failed to report unhandled rejection:', err);
  });
});

/**
 * Enhanced console.error wrapper for React error detection
 * 
 * Wraps console.error to detect React-specific errors and warnings.
 * Maintains original console.error functionality while adding detection.
 */
const originalConsoleError = console.error;
console.error = (...args: unknown[]): void => {
  originalConsoleError.apply(console, args);
  
  // Detect React errors and warnings (only in development)
  if (import.meta.env.DEV) {
    const errorString = args.map(String).join(' ');
    if (errorString.includes('Error:') || errorString.includes('Warning:')) {
      console.log('🔍 Console error detected:', args);
    }
  }
};

/**
 * Set favicon dynamically from Supabase Storage
 */
const setFavicon = () => {
  try {
    const faviconUrl = getFaviconUrl();
    if (faviconUrl && faviconUrl !== '/favicon.ico') {
      // Update existing favicon link
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = faviconUrl;
      
      // Update apple-touch-icon
      let appleTouchLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleTouchLink) {
        appleTouchLink = document.createElement('link');
        appleTouchLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleTouchLink);
      }
      appleTouchLink.href = faviconUrl;
      
      // Add additional sizes for better browser support
      const sizes = ['32x32', '16x16', '192x192', '512x512'];
      sizes.forEach(size => {
        const existing = document.querySelector(`link[rel="icon"][sizes="${size}"]`) as HTMLLinkElement;
        if (!existing) {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.sizes = size;
          link.href = faviconUrl;
          document.head.appendChild(link);
        } else {
          existing.href = faviconUrl;
        }
      });
      
      console.log('✅ Favicon set to:', faviconUrl);
    }
  } catch (error) {
    console.warn('Could not set favicon:', error);
  }
};

// Set favicon immediately
setFavicon();

/**
 * Application root element
 * 
 * Locates the root DOM element and mounts the React application.
 * Throws error if root element is not found.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount React application');
}

/**
 * React root instance
 * 
 * Creates React 18 root and renders application with error boundary.
 */
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthWrapper>
          <App />
        </AuthWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);