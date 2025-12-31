/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays a user-friendly error message.
 * Automatically reports errors to the development team via error reporting service.
 * 
 * Features:
 * - Catches errors in component tree
 * - Displays user-friendly error UI
 * - Automatic error reporting
 * - Reload functionality
 * 
 * @module components/ErrorBoundary
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError, getOrCreateSessionId } from '../services/errorReportingService';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error object that was caught, if any */
  error: Error | null;
}

/**
 * Error Boundary class component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initial component state
   */
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  /**
   * Update state when an error is caught
   * 
   * Called during render phase, so side effects are not allowed.
   * 
   * @param error - The error that was thrown
   * @returns New state with error information
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Handle error after it has been caught
   * 
   * Called during commit phase, so side effects are allowed.
   * Reports error to development team.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information from React
   */
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 ErrorBoundary caught an error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    // Log full error details for debugging
    if (import.meta.env.DEV) {
      console.error('🔍 Full error details:', {
        error,
        errorInfo,
        errorString: JSON.stringify(error).substring(0, 1000)
      });
    }
    
    // Report error with React error info (non-blocking)
    reportError(error, {
      appState: 'ErrorBoundary',
      sessionId: getOrCreateSessionId()
    }).catch(() => {
      // Error reporting failed, but we already logged it
      // Don't throw - error reporting should never break the app
    });
  }

  /**
   * Handle reset button click
   * 
   * Reloads the page to reset application state.
   */
  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const errorMessage = error?.message || 'Unknown error';
      const errorName = error?.name || 'Error';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              An error has occurred. The error has been reported to our team.
            </p>
            
            {/* Show error details in development mode */}
            {import.meta.env.DEV && error && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
                <p className="font-semibold mb-2">Error Details (Dev Mode):</p>
                <p className="text-red-600 mb-1"><strong>Name:</strong> {errorName}</p>
                <p className="text-red-600 mb-1"><strong>Message:</strong> {errorMessage}</p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                      {error.stack}
                    </pre>
                  </details>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Check the browser console (F12) for more details.
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-bold mt-4"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
