import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { ParlantClient } from 'parlant-client';
import type { EventCreationParams } from 'parlant-client/src/api';
import { useTranslation, type Language } from '../hooks/useTranslation';
import { useEventPolling, type PollingConfig } from '../hooks/useEventPolling';
import { useMessageProcessing } from '../hooks/useMessageProcessing';
import { WelcomeMessage } from './WelcomeMessage';
import { log, logWarn, logError } from '../utils/logger';

/**
 * Session data structure for creating sessions
 */
interface SessionData {
  agent_id: string;
  allow_greeting: boolean;
  title: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
}

/**
 * Message data structure
 */
interface MessageData {
  message?: string;
  participant?: {
    display_name?: string;
  };
}

/**
 * Extended message interface for rendering
 */
interface DisplayMessage {
  id?: string;
  kind: string;
  source: string;
  creationUtc: Date;
  offset: number;
  correlationId: string;
  data: MessageData;
  status?: string | null;
  error?: string;
  isStatusMessage?: boolean;
  serverStatus?: string;
  created_at?: string;
}

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
  const [sessionId, setSessionId] = useState<string | null>(externalSessionId || null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [hasSimulatedWelcome, setHasSimulatedWelcome] = useState<boolean>(parentHasShownWelcome || false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionCreatedRef = useRef<boolean>(false);
  const previousMessageCountRef = useRef<number>(0);

  // Translation hook
  const { t } = useTranslation(language);

  // Use translated agent name if not provided
  const displayAgentName = agentName || t('agent.defaultName');

  // Create ParlantClient instance (memoized to avoid recreation)
  const parlantClient = useMemo(() => new ParlantClient({
    environment: serverUrl,
  }), [serverUrl]);

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
      setError(errorMsg);
    }
  });

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
   * Creates a new session
   */
  const createSession = useCallback(async (message?: EventCreationParams): Promise<void> => {
    if (isCreatingSession) return;

    try {
      setIsCreatingSession(true);
      setError('');

      const now = new Date();
      const sessionData: SessionData = {
        agent_id: agentId,
        allow_greeting: false,
        title: `Chat Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      if (customerId && customerId.trim()) {
        try {
          log('Creating session for customer:', customerId.trim());
          const customers = await parlantClient.customers.list();
          log('Available customers:', customers);

          const existingCustomer = customers.find(c => c.name === customerId.trim());

          if (existingCustomer) {
            log('Found existing customer:', existingCustomer);
            sessionData.customer_id = existingCustomer.id;
          } else {
            log('Creating new customer:', customerId.trim());
            const newCustomer = await parlantClient.customers.create({
              name: customerId.trim(),
              tags: []
            });
            log('Created new customer:', newCustomer);
            sessionData.customer_id = newCustomer.id;
          }

          log('Session data with customer_id:', sessionData);
        } catch (customerError: unknown) {
          logWarn('Failed to handle customer, proceeding with guest session:', customerError);
          // Continue without customerId - creates guest session
        }
      } else {
        log('No customer ID provided, creating guest session');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        log('Using auth token for session creation');
      }

      const response = await fetch(`${serverUrl}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Provide specific error messages for auth failures
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to create sessions.');
        }

        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const newSession = await response.json();

      if (!newSession?.id) {
        throw new Error('Session was not created - no ID returned');
      }

      setSessionId(newSession.id);
      setHasSimulatedWelcome(false); // Reset welcome state for new session
      setShowWelcomeMessage(false); // Reset welcome message display
      onSessionCreated?.(newSession.id);

      if (message) {
        const messageHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (authToken) {
          messageHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const messageResponse = await fetch(`${serverUrl}/sessions/${newSession.id}/events`, {
          method: 'POST',
          headers: messageHeaders,
          body: JSON.stringify(message),
        });

        if (!messageResponse.ok) {
          const errorData = await messageResponse.json();
          logWarn('Failed to send initial message:', errorData);
        }
      }

      setIsCreatingSession(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error) {
      const errorMessage = `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logError(errorMessage, error);
      setError(errorMessage);
      setIsCreatingSession(false);
      throw error;
    }
  }, [agentId, customerId, serverUrl, parlantClient.customers, isCreatingSession, onSessionCreated, authToken]);

  /**
   * Sends a message
   */
  const postMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim()) return;

    const message: EventCreationParams = {
      kind: 'message',
      message: content,
      source: 'customer',
    };

    if (sessionId) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${serverUrl}/sessions/${sessionId}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Provide specific error messages for auth failures
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to send messages.');
        }

        throw new Error(`Failed to send message: HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }
    } else {
      await createSession(message);
    }
  }, [sessionId, serverUrl, createSession, authToken]);

  /**
   * Sends a message from the input field
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
      await postMessage(messageText);
      // Trigger immediate poll to get bot response quickly
      triggerImmediatePoll();
    } catch (error) {
      logError('Failed to send message:', error);
      setError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      clearPendingMessage();
    }
  }, [inputMessage, postMessage, updateLastUserMessageTime, addPendingMessage, clearPendingMessage, triggerImmediatePoll]);

  /**
   * Handles key press events in the input field
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  /**
   * Formats timestamp for display
   */
  const formatTimestamp = useCallback((timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  /**
   * Gets the display name for a message source
   */
  const getSourceDisplayName = useCallback((source: string, participantName?: string): string => {
    switch (source) {
      case 'customer':
        return 'You';
      case 'ai_agent':
        return participantName || displayAgentName;
      case 'human_agent':
        return participantName || displayAgentName;
      default:
        return source;
    }
  }, [displayAgentName]);

  // Component lifecycle logging
  useEffect(() => {
    log('ChatInterface mounted with sessionId:', externalSessionId || 'none');
    return () => {
      log('ChatInterface unmounting');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Handle external sessionId changes
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      log('Loading existing session:', externalSessionId);
      setSessionId(externalSessionId);
      sessionCreatedRef.current = true; // Mark as having a session
      setHasSimulatedWelcome(false); // Reset welcome state for new session
      setShowWelcomeMessage(false); // Reset welcome message display
    }
  }, [externalSessionId, sessionId]);

  /**
   * Effect to show welcome message when chat starts
   */
  useEffect(() => {
    if (sessionId && messages.length === 0 && !hasSimulatedWelcome && !isCreatingSession && !parentHasShownWelcome) {
      setShowWelcomeMessage(true);
      setHasSimulatedWelcome(true);
      log('Showing welcome message for session:', sessionId);
    }
    // Also show welcome message if parent has shown welcome but we haven't displayed it yet
    else if (sessionId && messages.length === 0 && !showWelcomeMessage && parentHasShownWelcome && !isCreatingSession) {
      setShowWelcomeMessage(true);
      log('Restoring welcome message display for session:', sessionId);
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
    if (!sessionId && !isCreatingSession && !sessionCreatedRef.current && !externalSessionId) {
      sessionCreatedRef.current = true;
      
      // Get language-specific welcome message if provided
      let initialMessageEvent: EventCreationParams | undefined;
      if (welcomeMessages) {
        const languageSpecificMessage = welcomeMessages[language];
        if (languageSpecificMessage && languageSpecificMessage.trim()) {
          // Replace placeholders with actual values
          const messageWithReplacements = languageSpecificMessage
            .replace(/\{customerName\}/g, customerName || '')
            .replace(/\{agentName\}/g, agentName || displayAgentName)
            .trim();
          
          if (messageWithReplacements) {
            initialMessageEvent = {
              kind: 'message',
              message: messageWithReplacements,
              source: 'customer',
            };
          }
        }
      }
      
      createSession(initialMessageEvent).catch(error => {
        logError('Failed to create session on mount:', error);
        sessionCreatedRef.current = false;
      });
    }
  }, [externalSessionId, sessionId, isCreatingSession, createSession, welcomeMessages, language, customerName, agentName, displayAgentName]);

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
      {error && (
        <div className="bg-red-50 border-b border-red-100 px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} className="sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-xs sm:text-sm truncate">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800 flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50/50 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {isCreatingSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600">{t('status.connecting', { agentName: displayAgentName })}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Welcome Message */}
            {showWelcomeMessage && (
              <WelcomeMessage
                agentName={displayAgentName}
                customerName={customerName}
                language={language}
                onMessageAppear={handleWelcomeMessageAppear}
                delay={1000}
                skipAnimation={parentHasShownWelcome}
                customWelcomeText={welcomeMessages?.[language]}
              />
            )}

            {/* Regular Messages */}
            {messages.length > 0 && (
              [...messages,
              // Add pending message if it exists
              ...(pendingMessage?.data && pendingMessage.data.message
                ? [pendingMessage as DisplayMessage]
                : []),
              // Add status message if it exists
              ...(statusMessage ? [statusMessage as DisplayMessage] : [])
              ].map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.source === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 shadow-lg ${message.source === 'customer'
                      ? (message.serverStatus === 'pending'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-br-lg opacity-75'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-lg')
                      : message.source === 'human_agent'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-bl-lg'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-lg'
                      }`}
                  >
                    {/* Message Header for non-customer messages */}
                    {message.source !== 'customer' && (
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className={`text-xs font-medium pr-2 sm:pr-4 truncate ${message.source === 'human_agent' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                          {getSourceDisplayName(message.source, (message.data as MessageData)?.participant?.display_name)}
                        </span>
                        <span className={`text-xs flex-shrink-0 ${message.source === 'human_agent' ? 'text-green-200' : 'text-gray-400'
                          }`}>
                          {formatTimestamp(new Date(message.created_at || message.creationUtc || Date.now()))}
                        </span>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="leading-relaxed font-medium whitespace-pre-wrap text-sm sm:text-base">
                      {message.isStatusMessage ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-gray-600 font-medium">
                            {(message.data as MessageData)?.message || ''}
                          </span>
                        </div>
                      ) : (
                        (message.data as MessageData)?.message || ''
                      )}
                    </div>

                    {/* Timestamp for customer messages */}
                    {message.source === 'customer' && (
                      <div className="text-xs text-blue-200 mt-1 sm:mt-2 text-right flex items-center justify-end space-x-1">
                        <span>
                          {formatTimestamp(new Date(message.created_at || message.creationUtc || Date.now()))}
                        </span>
                        {message.serverStatus === 'pending' && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-2 sm:p-3 lg:p-4 m-1 sm:m-2 rounded-xl sm:rounded-2xl">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={sessionId ? t('input.placeholder') : t('input.placeholderConnecting')}
              disabled={!sessionId || isCreatingSession}
              className="w-full bg-white border-2 border-gray-200 focus:border-blue-500 text-gray-800 placeholder-gray-400 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-base resize-none transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !sessionId || isCreatingSession}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex-shrink-0"
          >
            {showInfo ? (
              <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send size={18} className="sm:w-5 sm:h-5" />
            )}
          </button>
        </div>

        {/* Powered by Parlant attribution */}
        {showAttribution && (
          <div className="flex items-center justify-center mt-2 sm:mt-3">
            <a
              href="https://www.parlant.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center space-x-1"
            >
              <span>Powered by</span>
              <span className="font-semibold">Parlant</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
