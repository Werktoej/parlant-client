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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center space-x-3">
                <AlertCircle size={32} />
                <div>
                  <h1 className="text-2xl font-bold">
                    {errorTitle || 'Oops! Something went wrong'}
                  </h1>
                  <p className="text-red-100 mt-1">
                    {errorMessage || 'The application encountered an unexpected error'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">What happened?</h2>
                <p className="text-gray-600">
                  The chat application encountered an error and couldn't continue.
                  This might be due to a configuration issue or a temporary problem.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-mono text-sm break-all">
                      {error.toString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Component Stack (in development) */}
              {errorInfo && process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    Show technical details
                  </summary>
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <RefreshCw size={18} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <RefreshCw size={18} />
                  <span>Reload Page</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Need help?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
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

