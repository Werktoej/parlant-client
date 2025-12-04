/**
 * ErrorDisplay - Presentation component for displaying errors
 * Follows ADR-004: Separation of Concerns - Pure presentation component
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Props for ErrorDisplay component
 */
interface ErrorDisplayProps {
  /** Error message to display */
  message: string;
  /** Callback when error should be dismissed */
  onDismiss: () => void;
}

/**
 * ErrorDisplay - Pure presentation component for error messages
 * 
 * @example
 * ```tsx
 * <ErrorDisplay
 *   message="Failed to connect"
 *   onDismiss={() => setError('')}
 * />
 * ```
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-destructive text-destructive-foreground border-b border-destructive px-3 sm:px-6 py-2 sm:py-3">
      <div className="flex items-center space-x-2">
        <AlertCircle size={14} className="sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
        <span className="text-destructive text-xs sm:text-sm truncate">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-auto text-destructive-foreground hover:text-destructive-foreground flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
};

