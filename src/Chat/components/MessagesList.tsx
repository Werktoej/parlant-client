/**
 * MessagesList - Presentation component for displaying chat messages
 * Follows ADR-004: Separation of Concerns - Pure presentation component
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { WelcomeMessage } from './WelcomeMessage';
import { MessageBubble } from './MessageBubble';
import type { MessageInterface } from '../hooks/useMessageProcessing';
import type { PendingMessage } from '../hooks/useMessageProcessing';
import type { Language } from '../hooks/useTranslation';

/**
 * Props for MessagesList component
 */
interface MessagesListProps {
  /** Array of messages to display */
  messages: MessageInterface[];
  /** Pending message (if any) */
  pendingMessage?: PendingMessage;
  /** Status message (if any) */
  statusMessage?: MessageInterface | null;
  /** Whether session is being created */
  isCreatingSession: boolean;
  /** Whether to show welcome message */
  showWelcomeMessage: boolean;
  /** Agent name for display */
  agentName: string;
  /** Customer name for personalization */
  customerName?: string;
  /** Language for the interface */
  language: Language;
  /** Callback when welcome message appears */
  onWelcomeMessageAppear?: () => void;
  /** Whether welcome was already shown */
  hasShownWelcome: boolean;
  /** Custom welcome messages */
  welcomeMessages?: Record<'da' | 'en', string>;
  /** Function to get display name for message source */
  getSourceDisplayName: (source: string, participantName?: string) => string;
  /** Function to format timestamp */
  formatTimestamp: (timestamp: Date) => string;
  /** Translation function */
  t: (key: string, params?: Record<string, string>) => string;
}

/**
 * MessagesList - Pure presentation component for rendering chat messages
 * 
 * @example
 * ```tsx
 * <MessagesList
 *   messages={messages}
 *   isCreatingSession={false}
 *   showWelcomeMessage={true}
 *   agentName="Agent"
 *   language="en"
 *   getSourceDisplayName={getSourceDisplayName}
 *   formatTimestamp={formatTimestamp}
 *   t={t}
 * />
 * ```
 */
export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  pendingMessage,
  statusMessage,
  isCreatingSession,
  showWelcomeMessage,
  agentName,
  customerName,
  language,
  onWelcomeMessageAppear,
  hasShownWelcome,
  welcomeMessages,
  getSourceDisplayName,
  formatTimestamp,
  t
}) => {
  if (isCreatingSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('status.connecting', { agentName })}</p>
        </div>
      </div>
    );
  }

  // Combine all messages for display
  const allMessages: Array<MessageInterface | PendingMessage> = [
    ...messages,
    ...(pendingMessage?.data && pendingMessage.data.message ? [pendingMessage as MessageInterface] : []),
    ...(statusMessage ? [statusMessage] : [])
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <WelcomeMessage
          agentName={agentName}
          customerName={customerName}
          language={language}
          onMessageAppear={onWelcomeMessageAppear}
          delay={1000}
          skipAnimation={hasShownWelcome}
          customWelcomeText={welcomeMessages?.[language]}
        />
      )}

      {/* Regular Messages */}
      {allMessages.length > 0 &&
        allMessages.map((message, index) => {
          const messageData = message.data as { message?: string; participant?: { display_name?: string } };
          const displayName = getSourceDisplayName(
            message.source,
            messageData?.participant?.display_name
          );
          const timestamp = formatTimestamp(
            new Date((message as MessageInterface).created_at || (message as MessageInterface).creationUtc || Date.now())
          );

          return (
            <MessageBubble
              key={message.id || index}
              message={message as MessageInterface}
              displayName={displayName}
              timestamp={timestamp}
              isStatusMessage={(message as MessageInterface).isStatusMessage}
            />
          );
        })}
    </div>
  );
};

