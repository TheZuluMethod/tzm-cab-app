import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Granular error boundary for individual sections
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`❌ Error in ${this.props.sectionName}:`, error);
    console.error('Error Info:', errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            Error rendering {this.props.sectionName}: {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

