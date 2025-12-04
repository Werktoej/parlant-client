/**
 * ChatInterface - Container component for chat functionality
 * Follows ADR-004: Separation of Concerns - Composes presentation and logic layers
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation, type Language } from '../hooks/useTranslation';
import { useEventPolling, type PollingConfig } from '../hooks/useEventPolling';
import { useMessageProcessing } from '../hooks/useMessageProcessing';
import { useChatSession } from '../hooks/useChatSession';
import { useChatMessaging } from '../hooks/useChatMessaging';
import { ErrorDisplay } from './ErrorDisplay';
import { MessagesList } from './MessagesList';
import { ChatInput } from './ChatInput';
import { logError } from '../utils/logger';

/**
 * Props for the shared ChatInterface component
 */
interface ChatInterfaceProps {
  /** The URL of the Parlant server */
  serverUrl: string;
  /** The ID of the agent to chat with */
  agentId: string;
  /** The ID of the customer */
  customerId: string;
  /** Customer name for personalization */
  customerName?: string;
  /** Agent name for display purposes */
  agentName?: string;
  /** Authentication token for backend requests */
  authToken?: string;
  /** Whether to automatically scroll to new messages */
  scrollToNewMessage?: boolean;
  /** Language for the interface */
  language?: Language;
  /** Session ID if using existing session */
  sessionId?: string | null;
  /** Whether welcome message has been shown across chat modes */
  hasShownWelcome?: boolean;
  /** Callback when session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when welcome message is shown */
  onWelcomeShown?: () => void;
  /** Custom polling intervals for adaptive polling (optional) */
  pollingConfig?: PollingConfig;
  /** Whether to show "Powered by Parlant" attribution (default: false) */
  showAttribution?: boolean;
  /** Welcome messages per language to send when creating a new session (optional) */
  welcomeMessages?: Record<'da' | 'en', string>;
}

/**
 * Shared chat interface component that handles all chat functionality.
 * Can be used in both popup and full-screen modes.
 * 
 * Follows ADR principles:
 * - ADR-001: Complexity Management - Uses smaller sub-components
 * - ADR-004: Separation of Concerns - Logic in hooks, presentation in components
 * - ADR-007: Loose Coupling - Uses dependency injection via props
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  serverUrl,
  agentId,
  customerId,
  customerName,
  agentName,
  authToken,
  scrollToNewMessage = true,
  language = 'en',
  sessionId: externalSessionId,
  hasShownWelcome: parentHasShownWelcome,
  onSessionCreated,
  onWelcomeShown,
  pollingConfig,
  showAttribution = true,
  welcomeMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  // Translation hook
  const { t } = useTranslation(language);

  // Use translated agent name if not provided
  const displayAgentName = agentName || t('agent.defaultName');

  // Session management hook
  const {
    sessionId,
    isCreatingSession,
    error: sessionError,
    createSession,
    setError: setSessionError
  } = useChatSession({
    serverUrl,
    agentId,
    customerId,
    authToken,
    externalSessionId,
    onSessionCreated
  });

  // Message processing hook
  const {
    messages,
    statusMessage,
    pendingMessage,
    processEvents,
    addPendingMessage,
    clearPendingMessage
  } = useMessageProcessing({ t });

  // Event polling hook
  const {
    botStatus,
    updateLastUserMessageTime,
    triggerImmediatePoll
  } = useEventPolling({
    sessionId,
    serverUrl,
    authToken,
    pollingConfig,
    onEventsReceived: processEvents,
    onError: (errorMsg: string) => {
      logError('Event polling error:', errorMsg);
      setSessionError(errorMsg);
    }
  });

  // Messaging hook
  const {
    inputMessage,
    setInputMessage,
    sendMessage: sendMessageBase,
    handleKeyPress
  } = useChatMessaging({
    serverUrl,
    sessionId,
    authToken,
    createSession
  });

  // Welcome message state
  const [hasSimulatedWelcome, setHasSimulatedWelcome] = React.useState<boolean>(
    parentHasShownWelcome || false
  );
  const [showWelcomeMessage, setShowWelcomeMessage] = React.useState<boolean>(false);

  /**
   * Scrolls to the bottom of the messages container
   */
  const scrollToBottom = useCallback((): void => {
    if (!scrollToNewMessage) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [scrollToNewMessage]);

  /**
   * Scrolls to bottom whenever there are new messages
   */
  const scrollToBottomIfNewMessages = useCallback((): void => {
    if (!scrollToNewMessage) return;

    const hasNewMessages = messages.length > previousMessageCountRef.current;

    if (hasNewMessages) {
      previousMessageCountRef.current = messages.length;
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [scrollToNewMessage, messages.length, scrollToBottom]);

  /**
   * Wraps sendMessage to include pending message handling
   */
  const sendMessage = useCallback(async (): Promise<void> => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    updateLastUserMessageTime();
    addPendingMessage(messageText);

    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 10);

    try {
      await sendMessageBase();
      // Trigger immediate poll to get bot response quickly
      triggerImmediatePoll();
    } catch (error) {
      logError('Failed to send message:', error);
      setSessionError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      clearPendingMessage();
    }
  }, [inputMessage, sendMessageBase, updateLastUserMessageTime, addPendingMessage, clearPendingMessage, triggerImmediatePoll, setSessionError]);


  /**
   * Formats timestamp for display
   */
  const formatTimestamp = useCallback((timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  /**
   * Gets the display name for a message source
   */
  const getSourceDisplayName = useCallback(
    (source: string, participantName?: string): string => {
      switch (source) {
        case 'customer':
          return customerName || t('message.you');
        case 'ai_agent':
          return participantName || displayAgentName;
        case 'human_agent':
          return participantName || displayAgentName;
        default:
          return source;
      }
    },
    [displayAgentName, customerName, t]
  );

  // Handle external sessionId changes - reset welcome state
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      setHasSimulatedWelcome(false);
      setShowWelcomeMessage(false);
    }
  }, [externalSessionId, sessionId]);

  /**
   * Effect to show welcome message when chat starts
   */
  useEffect(() => {
    if (
      sessionId &&
      messages.length === 0 &&
      !hasSimulatedWelcome &&
      !isCreatingSession &&
      !parentHasShownWelcome
    ) {
      setShowWelcomeMessage(true);
      setHasSimulatedWelcome(true);
    } else if (
      sessionId &&
      messages.length === 0 &&
      !showWelcomeMessage &&
      parentHasShownWelcome &&
      !isCreatingSession
    ) {
      setShowWelcomeMessage(true);
    }
  }, [sessionId, messages.length, hasSimulatedWelcome, isCreatingSession, parentHasShownWelcome, showWelcomeMessage]);

  /**
   * Callback when welcome message appears
   */
  const handleWelcomeMessageAppear = useCallback((): void => {
    onWelcomeShown?.();
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [scrollToBottom, onWelcomeShown]);

  useEffect(() => {
    scrollToBottomIfNewMessages();
  }, [messages, scrollToBottomIfNewMessages]);

  useEffect(() => {
    if (scrollToNewMessage && statusMessage) {
      setTimeout(() => {
        scrollToBottom();
      }, 10);
    }
  }, [statusMessage, scrollToNewMessage, scrollToBottom]);

  const showInfo = botStatus === 'processing' || botStatus === 'typing';

  return (
    <div className="flex flex-col h-full">
      {/* Error Display */}
      {sessionError && (
        <ErrorDisplay message={sessionError} onDismiss={() => setSessionError('')} />
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-background scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
      >
        <MessagesList
          messages={messages}
          pendingMessage={pendingMessage}
          statusMessage={statusMessage}
          isCreatingSession={isCreatingSession}
          showWelcomeMessage={showWelcomeMessage}
          agentName={displayAgentName}
          customerName={customerName}
          language={language}
          onWelcomeMessageAppear={handleWelcomeMessageAppear}
          hasShownWelcome={parentHasShownWelcome ?? false}
          welcomeMessages={welcomeMessages}
          getSourceDisplayName={getSourceDisplayName}
          formatTimestamp={formatTimestamp}
          t={t}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={sendMessage}
        onKeyPress={handleKeyPress}
        placeholder={sessionId ? t('input.placeholder') : t('input.placeholderConnecting')}
        disabled={!sessionId || isCreatingSession}
        isLoading={showInfo}
        showAttribution={showAttribution}
      />
    </div>
  );
};
