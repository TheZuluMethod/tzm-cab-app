import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReportDisplay from './ReportDisplay';
import { BoardMember, ICPProfile, PersonaBreakdown, UserInput } from '../types';
import { reportError, getOrCreateSessionId } from '../services/errorReportingService';

interface ReportDisplayWrapperProps {
  reportContent: string;
  isStreaming: boolean;
  onReset: () => void;
  members: BoardMember[];
  icpProfile?: ICPProfile;
  personaBreakdowns?: PersonaBreakdown[];
  qcStatus?: { score: number; verified: number; total: number; issues: number } | null;
  userInput?: UserInput | null;
  sessionId?: string | null;
  onShare?: () => void;
  isTrial?: boolean;
  onUpgrade?: () => void;
  subscriptionStatus?: {
    isTrial: boolean;
    reportsRemaining: number;
    needsUpgrade: boolean;
  };
  reportTitle?: string;
  reportDate?: string;
  reportTimestamp?: string;
  // Industry dashboard data removed - no longer used
}

/**
 * Wrapper component that catches errors specifically in ReportDisplay
 * This provides more granular error handling than the global ErrorBoundary
 */
class ReportDisplayErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ReportDisplay Error Boundary caught error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    
    this.setState({ error, errorInfo });
    
    // Report the error
    reportError(error, {
      appState: 'ReportDisplay',
      sessionId: getOrCreateSessionId()
    }).catch(err => {
      console.error('Failed to report error:', err);
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-[1400px] mx-auto p-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Report Display Error</h1>
            <p className="text-red-700 mb-4">
              An error occurred while rendering the report. The error has been logged and reported.
            </p>
            
            {this.state.error && (
              <div className="mb-4 p-4 bg-white rounded border border-red-200">
                <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                <p className="text-xs font-mono text-red-600 break-all mb-2">
                  <strong>Name:</strong> {this.state.error.name}
                </p>
                <p className="text-xs font-mono text-red-600 break-all mb-2">
                  <strong>Message:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-red-800 cursor-pointer">Stack Trace</summary>
                    <pre className="text-xs font-mono text-red-600 mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-red-800 cursor-pointer">Component Stack</summary>
                    <pre className="text-xs font-mono text-red-600 mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ReportDisplayWrapper: React.FC<ReportDisplayWrapperProps> = (props) => {
  // Log props for debugging with full details (dev only)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('📊 ReportDisplayWrapper - Props received:', {
        reportContentLength: props.reportContent?.length || 0,
        reportContentType: typeof props.reportContent,
        reportContentPreview: props.reportContent?.substring(0, 200),
        isStreaming: props.isStreaming,
        membersCount: props.members?.length || 0,
        membersType: Array.isArray(props.members),
        members: props.members,
        hasIcpProfile: !!props.icpProfile,
        icpProfileType: typeof props.icpProfile,
        icpProfile: props.icpProfile,
        personaBreakdownsCount: props.personaBreakdowns?.length || 0,
        personaBreakdownsType: Array.isArray(props.personaBreakdowns),
        personaBreakdowns: props.personaBreakdowns,
        hasQcStatus: !!props.qcStatus,
        qcStatus: props.qcStatus,
        hasUserInput: !!props.userInput,
        userInput: props.userInput
      });
    }
    
    // Deep validate props
    try {
      if (props.reportContent && typeof props.reportContent !== 'string') {
        console.error('❌ Invalid reportContent type:', typeof props.reportContent, props.reportContent);
      }
      if (props.members) {
        if (!Array.isArray(props.members)) {
          console.error('❌ Invalid members type:', typeof props.members, props.members);
        } else {
          props.members.forEach((m, idx) => {
            if (!m || typeof m !== 'object') {
              console.error(`❌ Invalid member at index ${idx}:`, m);
            }
          });
        }
      }
      if (props.personaBreakdowns) {
        if (!Array.isArray(props.personaBreakdowns)) {
          console.error('❌ Invalid personaBreakdowns type:', typeof props.personaBreakdowns, props.personaBreakdowns);
        } else {
          props.personaBreakdowns.forEach((p, idx) => {
            if (!p || typeof p !== 'object') {
              console.error(`❌ Invalid persona at index ${idx}:`, p);
            } else {
              // Validate persona structure
              if (!p.personaName || typeof p.personaName !== 'string') {
                console.error(`❌ Invalid personaName at index ${idx}:`, p.personaName);
              }
              if (p.decisionMakingProcess && typeof p.decisionMakingProcess !== 'object') {
                console.error(`❌ Invalid decisionMakingProcess at index ${idx}:`, p.decisionMakingProcess);
              }
            }
          });
        }
      }
      if (props.icpProfile) {
        if (typeof props.icpProfile !== 'object' || Array.isArray(props.icpProfile)) {
          console.error('❌ Invalid icpProfile type:', typeof props.icpProfile, props.icpProfile);
        } else {
          if (props.icpProfile.titles && !Array.isArray(props.icpProfile.titles)) {
            console.error('❌ Invalid icpProfile.titles:', props.icpProfile.titles);
          }
          if (props.icpProfile.useCaseFit && !Array.isArray(props.icpProfile.useCaseFit)) {
            console.error('❌ Invalid icpProfile.useCaseFit:', props.icpProfile.useCaseFit);
          }
          if (props.icpProfile.signalsAndAttributes && !Array.isArray(props.icpProfile.signalsAndAttributes)) {
            console.error('❌ Invalid icpProfile.signalsAndAttributes:', props.icpProfile.signalsAndAttributes);
          }
        }
      }
    } catch (validationError) {
      console.error('❌ Error validating props:', validationError);
      if (import.meta.env.DEV) {
        console.error('Stack:', (validationError as Error)?.stack);
      }
    }
  }, [props.reportContent, props.isStreaming, props.members, props.icpProfile, props.personaBreakdowns]);

  // Error Boundaries will catch any React render errors
  // No try-catch needed - React render errors can only be caught by Error Boundaries
  return (
    <ReportDisplayErrorBoundary>
      <ReportDisplay 
        {...props} 
        isTrial={props.isTrial} 
        onUpgrade={props.onUpgrade} 
        subscriptionStatus={props.subscriptionStatus}
        reportTitle={props.reportTitle}
        reportDate={props.reportDate}
        reportTimestamp={props.reportTimestamp}
      />
    </ReportDisplayErrorBoundary>
  );
};

export default ReportDisplayWrapper;

