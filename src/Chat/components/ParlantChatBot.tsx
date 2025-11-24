import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWindow } from './ChatWindow';
import { FullScreenChatbot } from './FullScreenChatbot';
import { setLoggingEnabled, log, logWarn, logError } from '../utils/logger';
import { useCustomerInfo } from '../hooks/useCustomerInfo';
import { useSessionWelcomeTracking } from '../hooks/useSessionWelcomeTracking';
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
  /** Whether to enable automatic session creation on mount (default: true) */
  autoStartSession?: boolean;
  /** Whether to show "Powered by Parlant" attribution (optional, default: false) */
  showAttribution?: boolean;
  /** Whether to enable console logging throughout the application (default: false) */
  enableLogging?: boolean;
  /** Force minimize the chat (external control) */
  forceMinimize?: boolean;
}

// Create a shared QueryClient instance
const defaultQueryClient = new QueryClient();

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
  autoStartSession = true,
  showAttribution = true,
  enableLogging = false,
  forceMinimize = false
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

  // Extract customer info using custom hook (DRY principle)
  const customerInfo = useCustomerInfo({
    propCustomerId,
    propCustomerName,
    authToken,
    authProvider,
  });

  // Track welcome message state using custom hook (DRY principle)
  const { markWelcomeShown, hasShownWelcome: hasSessionShownWelcome } = useSessionWelcomeTracking();

  // Chat state management
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(autoStartSession);
  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(initialMode === 'minimized');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(initialMode === 'fullscreen');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(0);

  // Minimize chat when forceMinimize prop is true
  useEffect(() => {
    if (forceMinimize) {
      setIsChatMinimized(true);
      setIsFullScreen(false);
    }
  }, [forceMinimize]);

  // Clear session and messages when agent or customer changes
  useEffect(() => {
    if (currentSessionId) {
      log('Agent or customer changed - clearing session and message history', {
        agentId,
        customerId: customerInfo.customerId
      });
      setCurrentSessionId(null);
      setSessionKey(prev => prev + 1); // Force re-mount of chat components
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, customerInfo.customerId]);

  /**
   * Handles when a new session is created
   */
  const handleSessionCreated = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    onSessionCreated?.(sessionId);
    log('Session created:', sessionId);
  }, [onSessionCreated]);

  /**
   * Handles updating session (including clearing)
   */
  const handleSessionUpdate = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    log('Session updated:', sessionId);
  }, []);

  /**
   * Handles when the welcome message is shown
   */
  const handleWelcomeShown = useCallback(() => {
    if (currentSessionId) {
      markWelcomeShown(currentSessionId);
      log('Welcome message shown for session:', currentSessionId);
    }
  }, [currentSessionId, markWelcomeShown]);

  /**
   * Minimizes the chat
   */
  const handleMinimizeChat = useCallback(() => {
    setIsChatMinimized(true);
    setIsFullScreen(false);
    onClose?.();
  }, [onClose]);

  /**
   * Restores the chat from minimized state
   */
  const handleRestoreChat = useCallback(() => {
    setIsChatMinimized(false);
    setIsChatEnabled(true);
  }, []);

  /**
   * Expands to full screen
   */
  const handleExpand = useCallback(() => {
    log(`Expanding to fullscreen with session: ${currentSessionId}`);
    setIsFullScreen(true);
  }, [currentSessionId]);

  /**
   * Contracts from full screen
   */
  const handleContract = useCallback(() => {
    log(`Contracting to popup with session: ${currentSessionId}`);
    setIsFullScreen(false);
  }, [currentSessionId]);


  return (
    <QueryClientProvider client={defaultQueryClient}>
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
          }}
        />
      )}

      {/* Floating Restore Button (when chat is minimized) */}
      {isChatEnabled && isChatMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleRestoreChat}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5"
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

