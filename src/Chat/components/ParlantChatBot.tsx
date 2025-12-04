/**
 * ParlantChatBot - Main chatbot component
 * Follows ADR principles:
 * - ADR-001: Complexity Management - Uses hooks for state management
 * - ADR-004: Separation of Concerns - Logic in hooks, presentation in components
 * - ADR-007: Loose Coupling - Self-contained with QueryClientProvider
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWindow } from './ChatWindow';
import { FullScreenChatbot } from './FullScreenChatbot';
import { setLoggingEnabled, log, logWarn, logError } from '../utils/logger';
import { useCustomerInfo } from '../hooks/useCustomerInfo';
import { useSessionWelcomeTracking } from '../hooks/useSessionWelcomeTracking';
import { useChatDisplayMode } from '../hooks/useChatDisplayMode';
import { useChatSessionState } from '../hooks/useChatSessionState';
import { parseJWT, isJWTExpired } from '../utils/jwt';
import type { Language } from '../hooks/useTranslation';
import type { PollingConfig } from '../types/chat';


/**
 * Props for the ParlantChatBot component
 */
export interface ParlantChatBotProps {
  /** The URL of the Parlant server (required) */
  serverUrl: string;
  /** The ID of the agent to chat with (required) */
  agentId: string;
  /** Agent name for display purposes (optional) */
  agentName?: string;
  /** JWT authentication token (optional) - will extract customerId and customerName if provided */
  authToken?: string;
  /** Auth provider type for token claim mapping (optional, default: 'generic')
   * Supported: 'microsoft', 'keycloak', 'auth0', 'okta', 'google', 'wordpress', 'generic' */
  authProvider?: 'microsoft' | 'keycloak' | 'auth0' | 'okta' | 'google' | 'wordpress' | 'generic';
  /** Customer ID (optional) - overrides JWT-derived value */
  customerId?: string;
  /** Customer name for personalization (optional) - overrides JWT-derived value */
  customerName?: string;
  /** Language for the interface (optional, default: 'en') */
  language?: Language;
  /** Initial display mode (optional, default: 'popup') */
  initialMode?: 'popup' | 'fullscreen' | 'minimized';
  /** Custom polling configuration (optional) */
  pollingConfig?: PollingConfig;
  /** Callback when a session is created (optional) */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when chat is closed/minimized (optional) */
  onClose?: () => void;
  /** Callback when display mode changes (optional) */
  onDisplayModeChange?: (mode: 'popup' | 'fullscreen' | 'minimized') => void;
  /** Whether to enable automatic session creation on mount (default: true) */
  autoStartSession?: boolean;
  /** Whether to show "Powered by Parlant" attribution (optional, default: false) */
  showAttribution?: boolean;
  /** Whether to enable console logging throughout the application (default: false) */
  enableLogging?: boolean;
  /** Force minimize the chat (external control) */
  forceMinimize?: boolean;
  /** Welcome messages per language to send when creating a new session (optional) */
  welcomeMessages?: Record<'da' | 'en', string>;
}

/**
 * Creates a QueryClient instance for the chatbot
 * This ensures the chatbot is self-contained and doesn't depend on external QueryClient
 */
const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000 // 5 minutes
      }
    }
  });
};

/**
 * ParlantChatBot - A complete, self-contained chatbot component
 * 
 * Features:
 * - JWT token parsing for automatic customer identification
 * - Popup and fullscreen modes with smooth transitions
 * - Minimize/restore functionality
 * - Session persistence and management
 * - Welcome message tracking across sessions
 * - Responsive design for mobile and desktop
 * 
 * @example
 * ```tsx
 * <ParlantChatBot
 *   serverUrl="https://api.example.com"
 *   agentId="agent-123"
 *   authToken="eyJhbGc..."
 *   enableLogging={true}  // Enable console logging for debugging
 * />
 * ```
 */
export const ParlantChatBot: React.FC<ParlantChatBotProps> = ({
  serverUrl,
  agentId,
  agentName,
  authToken,
  authProvider = 'generic',
  customerId: propCustomerId,
  customerName: propCustomerName,
  language = 'en',
  initialMode = 'popup',
  pollingConfig,
  onSessionCreated,
  onClose,
  onDisplayModeChange,
  autoStartSession = true,
  showAttribution = true,
  enableLogging = false,
  forceMinimize = false,
  welcomeMessages
}) => {
  // Configure logging based on prop
  useEffect(() => {
    setLoggingEnabled(enableLogging);
  }, [enableLogging]);

  // Validate JWT token in development mode
  useEffect(() => {
    if (authToken && enableLogging) {
      try {
        // Try to parse the token
        const payload = parseJWT(authToken);

        // Check if token is expired
        if (isJWTExpired(authToken)) {
          logWarn('JWT token is expired. Authentication requests will likely fail.');
        }

        // Check if required claims are present
        if (!payload.sub) {
          logError('JWT token is missing required "sub" claim. Customer identification will fail.');
        }

        // Log successful validation
        log('JWT token validated successfully', {
          hasSubClaim: !!payload.sub,
          hasNameClaim: !!payload.name,
          isExpired: isJWTExpired(authToken),
        });
      } catch (error) {
        logError('Failed to parse JWT token. Token may be malformed.', error);
      }
    }
  }, [authToken, enableLogging]);

  // Create QueryClient instance (memoized per component instance)
  const queryClient = useMemo(() => createQueryClient(), []);

  // Extract customer info using custom hook
  const customerInfo = useCustomerInfo({
    propCustomerId,
    propCustomerName,
    authToken,
    authProvider
  });

  // Track welcome message state using custom hook
  const { markWelcomeShown, hasShownWelcome: hasSessionShownWelcome } = useSessionWelcomeTracking();

  // Display mode management hook
  const {
    isChatEnabled,
    isChatMinimized,
    isFullScreen,
    minimizeChat: handleMinimizeChat,
    restoreChat: handleRestoreChat,
    expandToFullscreen: handleExpand,
    contractFromFullscreen: handleContract
  } = useChatDisplayMode({
    initialMode,
    forceMinimize,
    onDisplayModeChange,
    onClose
  });

  // Session state management hook
  const {
    currentSessionId,
    sessionKey,
    handleSessionCreated,
    handleSessionUpdate
  } = useChatSessionState({
    agentId,
    customerId: customerInfo.customerId,
    onSessionCreated
  });

  /**
   * Handles when the welcome message is shown
   */
  const handleWelcomeShown = useCallback(() => {
    if (currentSessionId) {
      markWelcomeShown(currentSessionId);
      log('Welcome message shown for session:', currentSessionId);
    }
  }, [currentSessionId, markWelcomeShown]);


  return (
    <QueryClientProvider client={queryClient}>
      {/* Popup Chat Window */}
      {isChatEnabled && !isChatMinimized && !isFullScreen && (
        <div
          className="fixed inset-2 sm:bottom-4 sm:right-4 sm:inset-auto z-50 w-[calc(100vw-1rem)] sm:w-[400px] md:w-[500px] h-[calc(100dvh-1rem)] sm:h-[600px] md:h-[700px] max-w-[500px] animate-in slide-in-from-bottom-5 duration-300"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'
          }}
        >
          <ChatWindow
            key={`chat-${sessionKey}-${currentSessionId || 'new'}`}
            serverUrl={serverUrl}
            agentId={agentId}
            customerId={customerInfo.customerId}
            customerName={customerInfo.customerName}
            agentName={agentName}
            authToken={authToken}
            scrollToNewMessage={true}
            language={language}
            sessionId={currentSessionId}
            hasShownWelcome={hasSessionShownWelcome(currentSessionId)}
            onSessionCreated={handleSessionCreated}
            onWelcomeShown={handleWelcomeShown}
            onClose={handleMinimizeChat}
            onExpand={handleExpand}
            pollingConfig={pollingConfig}
            showAttribution={showAttribution}
            welcomeMessages={welcomeMessages}
          />
        </div>
      )}

      {/* Full Screen Chatbot */}
      {isFullScreen && isChatEnabled && !isChatMinimized && (
        <FullScreenChatbot
          key={`fullscreen-${sessionKey}-${currentSessionId || 'new'}`}
          serverUrl={serverUrl}
          agentId={agentId}
          customerId={customerInfo.customerId}
          customerName={customerInfo.customerName}
          agentName={agentName}
          authToken={authToken}
          language={language}
          sessionId={currentSessionId}
          hasShownWelcome={hasSessionShownWelcome(currentSessionId)}
          onSessionCreated={handleSessionCreated}
          onWelcomeShown={handleWelcomeShown}
          onClose={handleMinimizeChat}
          onContract={handleContract}
          onSessionUpdate={handleSessionUpdate}
          pollingConfig={pollingConfig}
          showAttribution={showAttribution}
          welcomeMessages={welcomeMessages}
          configProps={{
            selectedToken: authToken || null,
            availableAgents: [],
            isLoadingAgents: false,
            agentError: '',
            onServerUrlChange: () => { },
            onAgentIdChange: () => { },
            onCustomerIdChange: () => { },
            onTokenSelect: () => { },
            onFetchAgents: () => { },
            onStartChat: () => { },
            isChatActive: isChatEnabled,
            welcomeMessages: welcomeMessages || { da: '', en: '' },
            onWelcomeMessagesChange: () => { },
            language: language || 'en',
            onLanguageChange: () => { },
            initialMode: initialMode || 'popup',
            onInitialModeChange: () => { },
            autoStartSession: autoStartSession ?? true,
            onAutoStartSessionChange: () => { },
          }}
        />
      )}

      {/* Floating Restore Button (when chat is minimized) */}
      {isChatEnabled && isChatMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleRestoreChat}
            className="bg-primary hover:bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5"
            title="Restore Chat"
            aria-label="Restore Chat"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}
    </QueryClientProvider>
  );
};

export default ParlantChatBot;

