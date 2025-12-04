/**
 * MessageBubble - Presentation component for displaying individual chat messages
 * 
 * Follows ADR principles:
 * - ADR-003: High Cohesion - Single responsibility: display a message
 * - ADR-004: Separation of Concerns - Pure presentation component
 * - ADR-005: Information Hiding - Minimal props interface
 */

import React from 'react';
import type { MessageInterface } from '../hooks/useMessageProcessing';
import { MessageContent } from './MessageContent';
import type { ButtonVariant } from '../../lib/theme/types';

/**
 * Props for MessageBubble component
 */
interface MessageBubbleProps {
  /** Message data to display */
  message: MessageInterface;
  /** Display name for the message source */
  displayName: string;
  /** Formatted timestamp string */
  timestamp: string;
  /** Whether this is a status/typing message */
  isStatusMessage?: boolean;
  /** Optional callback when a button in the message is clicked */
  onButtonClick?: (url: string, label: string, variant?: ButtonVariant) => void;
}

/**
 * TypingIndicator - Animated dots for typing status
 */
const TypingIndicator: React.FC = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

/**
 * PendingIndicator - Animated dots for pending message status
 */
const PendingIndicator: React.FC = () => (
  <div className="flex space-x-1 ml-2">
    <div className="w-1.5 h-1.5 bg-current opacity-50 rounded-full animate-pulse" />
    <div className="w-1.5 h-1.5 bg-current opacity-50 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
    <div className="w-1.5 h-1.5 bg-current opacity-50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
  </div>
);

/**
 * MessageBubble - Pure presentation component for rendering chat messages
 * Both customer and agent messages share the same layout structure
 * 
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   displayName="Agent"
 *   timestamp="10:30 AM"
 * />
 * ```
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  displayName,
  timestamp,
  isStatusMessage = false,
  onButtonClick
}) => {
  const isCustomer = message.source === 'customer';
  const isHumanAgent = message.source === 'human_agent';
  const isPending = message.serverStatus === 'pending';
  const messageText = (message.data as { message?: string })?.message || '';

  // Determine bubble styling based on source
  const getBubbleStyles = (): string => {
    if (isCustomer) {
      return isPending
        ? 'bg-muted text-muted-foreground border-[0.5px] border-primary/50'
        : 'bg-primary text-primary-foreground';
    }
    if (isHumanAgent) {
      return 'bg-accent text-accent-foreground';
    }
    return 'bg-card border-[0.5px] border-border/50 text-card-foreground';
  };

  // Determine text styling for header elements
  const getHeaderTextStyles = (): { name: string; time: string } => {
    if (isCustomer) {
      return {
        name: isPending ? 'text-muted-foreground' : 'text-primary-foreground',
        time: isPending ? 'text-muted-foreground/70' : 'text-primary-foreground/70'
      };
    }
    if (isHumanAgent) {
      return {
        name: 'text-accent-foreground',
        time: 'text-accent-foreground/70'
      };
    }
    return {
      name: 'text-muted-foreground',
      time: 'text-muted-foreground/70'
    };
  };

  const headerStyles = getHeaderTextStyles();

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 shadow-lg ${getBubbleStyles()} ${
          isCustomer ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
      >
        {/* Message Header - Consistent for all message types */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-3">
          <span className={`text-xs font-medium truncate ${headerStyles.name}`}>
            {displayName}
          </span>
          <div className="flex items-center flex-shrink-0">
            <span className={`text-xs ${headerStyles.time}`}>
              {timestamp}
            </span>
            {isPending && isCustomer && <PendingIndicator />}
          </div>
        </div>

        {/* Message Content */}
        <div className="leading-relaxed font-medium whitespace-pre-wrap text-sm sm:text-base">
          {isStatusMessage ? (
            <div className="flex items-center space-x-3">
              <TypingIndicator />
              <span className="opacity-80 font-medium">{messageText}</span>
            </div>
          ) : (
            <MessageContent
              content={messageText}
              isCustomerMessage={isCustomer}
              onButtonClick={onButtonClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
