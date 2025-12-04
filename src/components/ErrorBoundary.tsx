import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback UI to render on error */
  fallback?: ReactNode;
  /** Optional callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom error title */
  errorTitle?: string;
  /** Optional custom error message */
  errorMessage?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display errors gracefully
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and call optional error callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const { error, errorInfo } = this.state;
      const { errorTitle, errorMessage } = this.props;

      return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-card rounded-lg shadow-2xl border border-destructive overflow-hidden">
            {/* Header */}
            <div className="bg-destructive p-6 text-destructive-foreground">
              <div className="flex items-center space-x-3">
                <AlertCircle size={32} />
                <div>
                  <h1 className="text-2xl font-bold">
                    {errorTitle || 'Oops! Something went wrong'}
                  </h1>
                  <p className="text-destructive-foreground mt-1">
                    {errorMessage || 'The application encountered an unexpected error'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground mb-2">What happened?</h2>
                <p className="text-muted-foreground">
                  The chat application encountered an error and couldn't continue.
                  This might be due to a configuration issue or a temporary problem.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">Error Details:</h3>
                  <div className="bg-destructive text-destructive-foreground border border-destructive rounded-lg p-4">
                    <p className="font-mono text-sm break-all">
                      {error.toString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Component Stack (in development) */}
              {errorInfo && process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-card-foreground hover:text-foreground">
                    Show technical details
                  </summary>
                  <div className="mt-2 bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <RefreshCw size={18} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 bg-background hover:bg-muted border-2 border-border text-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <RefreshCw size={18} />
                  <span>Reload Page</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-2">Need help?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check your browser console for more details</li>
                  <li>• Verify your environment configuration (.env file)</li>
                  <li>• Make sure the server URL and agent ID are correct</li>
                  <li>• Try clearing your browser cache and reloading</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for ErrorBoundary with default props
 */
export const ChatErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      errorTitle="Chat Error"
      errorMessage="The chat application encountered an error"
      onError={(error, errorInfo) => {
        // Log to your error tracking service (e.g., Sentry)
        console.error('Chat Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

