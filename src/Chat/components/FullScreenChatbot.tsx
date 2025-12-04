import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, MessageSquare, Settings, Minimize2 } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { SessionList, type SessionListRef } from './SessionList';
import { ConfigurationModal } from '../../components/ConfigurationModal';
import { useTranslation, type Language } from '../hooks/useTranslation';
import { cn } from '../../lib/utils';
import { log } from '../utils/logger';
import { isAtBreakpoint } from '../constants/ui';
import type { PollingConfig } from '../types/chat';

/**
 * Interface for agent information from Parlant server
 */
interface Agent {
  id: string;
  name: string;
  description?: string;
  max_engine_iterations?: number;
  composition_mode?: string;
  tags?: string[];
}

/**
 * Props for the FullScreenChatbot component
 */
interface FullScreenChatbotProps {
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
  /** Language for the interface */
  language?: Language;
  /** Shared session ID from parent */
  sessionId?: string | null;
  /** Whether welcome message has been shown */
  hasShownWelcome?: boolean;
  /** Callback when a session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when session is updated (including clearing) */
  onSessionUpdate?: (sessionId: string | null) => void;
  /** Callback when welcome message is shown */
  onWelcomeShown?: () => void;
  /** Callback when the full-screen view is closed */
  onClose: () => void;
  /** Callback when contracting from full-screen to popup */
  onContract?: () => void;
  /** Custom polling intervals for adaptive polling (optional) */
  pollingConfig?: PollingConfig;
  /** Configuration props for the settings modal */
  configProps: {
    selectedToken: string | null;
    availableAgents: Agent[];
    isLoadingAgents: boolean;
    agentError: string;
    onServerUrlChange: (url: string) => void;
    onAgentIdChange: (id: string) => void;
    onCustomerIdChange: (id: string) => void;
    onTokenSelect: (tokenId: string) => void;
    onFetchAgents: () => void;
    onStartChat: () => void;
    isChatActive: boolean;
    welcomeMessages: Record<'da' | 'en', string>;
    onWelcomeMessagesChange: (messages: Record<'da' | 'en', string>) => void;
    language: 'da' | 'en';
    onLanguageChange: (language: 'da' | 'en') => void;
    initialMode: 'popup' | 'fullscreen' | 'minimized';
    onInitialModeChange: (mode: 'popup' | 'fullscreen' | 'minimized') => void;
    autoStartSession: boolean;
    onAutoStartSessionChange: (enabled: boolean) => void;
  };
  /** Whether to show "Powered by Parlant" attribution (default: false) */
  showAttribution?: boolean;
  /** Welcome messages per language to send when creating a new session (optional) */
  welcomeMessages?: Record<'da' | 'en', string>;
}

/**
 * FullScreenChatbot component that provides a full-screen chat experience
 * with session management in the left sidebar
 */
export const FullScreenChatbot: React.FC<FullScreenChatbotProps> = ({
  serverUrl,
  agentId,
  customerId,
  customerName,
  agentName,
  authToken,
  language = 'en',
  sessionId,
  hasShownWelcome,
  onSessionCreated,
  onWelcomeShown,
  onClose,
  onContract,
  onSessionUpdate,
  pollingConfig,
  configProps,
  showAttribution = true,
  welcomeMessages
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionId || null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(() => {
    // Start with sessions visible on desktop only
    return isAtBreakpoint('MD');
  });

  const { t } = useTranslation(language);
  const currentAgentName = agentName || t('agent.defaultName');

  // Ref for SessionList to trigger refresh
  const sessionListRef = useRef<SessionListRef>(null);

  // Sync selectedSessionId with incoming sessionId when entering fullscreen
  useEffect(() => {
    if (sessionId && sessionId !== selectedSessionId) {
      log(`Syncing fullscreen session: ${sessionId}`);
      setSelectedSessionId(sessionId);
    }
  }, [sessionId, selectedSessionId]);

  /**
   * Updates the main app session - helper function
   */
  const updateMainAppSession = useCallback((sessionId: string | null) => {
    onSessionUpdate?.(sessionId);
  }, [onSessionUpdate]);

  /**
   * Handles session selection from the sidebar
   */
  const handleSessionSelect = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Update the main app's session to keep popup and fullscreen in sync
    updateMainAppSession(sessionId);

    // Close sessions sidebar on mobile after selection
    if (!isAtBreakpoint('MD')) {
      setShowSessions(false);
    }
  }, [updateMainAppSession]);

  /**
   * Handles creating a new session
   */
  const handleNewSession = useCallback(() => {
    setSelectedSessionId(null);
    // Clear the main app's session to start fresh
    updateMainAppSession(null);
    // Refresh the session list when starting a new session
    sessionListRef.current?.refresh();
    log('New session button clicked, refreshing session list');
  }, [updateMainAppSession]);

  /**
   * Handles when a new session is created in the chat interface
   */
  const handleSessionCreated = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Update the main app's session
    updateMainAppSession(sessionId);
    // Also call the original callback for compatibility
    onSessionCreated?.(sessionId);
    // Refresh the session list to show the new session
    sessionListRef.current?.refresh();
    log('New session created, refreshing session list');
  }, [updateMainAppSession, onSessionCreated]);

  /**
   * Handles contracting from fullscreen - sync the selected session back to main app
   */
  const handleContractWithSessionSync = useCallback(() => {
    // If user selected a different session in fullscreen, update main app session
    if (selectedSessionId && selectedSessionId !== sessionId) {
      updateMainAppSession(selectedSessionId);
    }
    onContract?.();
  }, [selectedSessionId, sessionId, updateMainAppSession, onContract]);

  /**
   * Handles opening/closing the settings panel
   */
  const toggleSettings = useCallback(() => {
    log('FullScreen toggleSettings called:', {
      currentShowSettings: showSettings,
      configProps: {
        onStartChat: typeof configProps.onStartChat,
        isChatActive: configProps.isChatActive
      }
    });
    setShowSettings(!showSettings);
  }, [showSettings, configProps]);

  /**
   * Wrapped version of configProps.onStartChat that also closes the local modal
   */
  const handleApplyConfigAndClose = useCallback(() => {
    log('FullScreen handleApplyConfigAndClose called');
    // Call the original onStartChat from App.tsx
    configProps.onStartChat();
    // Close the local modal
    setShowSettings(false);
  }, [configProps]);

  /**
   * Handles toggling the sessions sidebar
   */
  const handleToggleSessions = useCallback(() => {
    setShowSessions(!showSessions);
  }, [showSessions]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Left Sidebar - Session List */}
      {showSessions && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden md:block w-64 lg:w-80 flex-shrink-0 bg-card border-r border-border">
            <SessionList
              ref={sessionListRef}
              serverUrl={serverUrl}
              authToken={authToken}
              selectedSessionId={selectedSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              language={language}
              customerId={customerId}
            />
          </div>

          {/* Mobile overlay */}
          <div className="md:hidden fixed inset-0 z-[70] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black"
              onClick={handleToggleSessions}
            />
            {/* Sidebar */}
            <div className="relative w-full max-w-sm bg-card h-full flex flex-col" style={{ paddingTop: 'max(0rem, env(safe-area-inset-top))', paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}>
              {/* Close Button for Mobile */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handleToggleSessions}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors bg-card rounded-full shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Session List */}
              <div className="flex-1 overflow-hidden">
                <SessionList
                  ref={sessionListRef}
                  serverUrl={serverUrl}
                  authToken={authToken}
                  selectedSessionId={selectedSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewSession={handleNewSession}
                  language={language}
                  customerId={customerId}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {/* Chat Content using ChatWindow */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            key={`chat-${selectedSessionId || sessionId || 'new'}`}
            serverUrl={serverUrl}
            agentId={agentId}
            customerId={customerId}
            customerName={customerName}
            agentName={currentAgentName}
            authToken={authToken}
            scrollToNewMessage={true}
            language={language}
            sessionId={selectedSessionId || sessionId}
            hasShownWelcome={hasShownWelcome}
            onSessionCreated={handleSessionCreated}
            onWelcomeShown={onWelcomeShown}
            onClose={onClose}
            onContract={handleContractWithSessionSync}
            onToggleSessions={handleToggleSessions}
            layoutMode="fullscreen"
            pollingConfig={pollingConfig}
            showAttribution={showAttribution}
            welcomeMessages={welcomeMessages}
          />
        </div>

        {/* Mobile Bottom Menu Bar - Only visible on mobile in fullscreen */}
        <div className="md:hidden bg-primary border-t border-primary" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-around py-3 px-4">
            {/* Conversations Button */}
            <button
              onClick={handleToggleSessions}
              className={cn(
                'flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200',
                showSessions
                  ? 'bg-background text-primary'
                  : 'text-primary-foreground hover:bg-background hover:text-primary'
              )}
            >
              <MessageSquare size={20} />
              <span className="text-xs font-medium">{t('conversations.title')}</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={toggleSettings}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 text-primary-foreground hover:bg-background hover:text-primary"
            >
              <Settings size={20} />
              <span className="text-xs font-medium">{t('settings.title')}</span>
            </button>

            {/* Exit Fullscreen Button */}
            <button
              onClick={handleContractWithSessionSync}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 text-primary-foreground hover:bg-background hover:text-primary"
            >
              <Minimize2 size={20} />
              <span className="text-xs font-medium">{t('common.minimize')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={showSettings}
        onClose={toggleSettings}
        serverUrl={serverUrl}
        onServerUrlChange={configProps.onServerUrlChange}
        agentId={agentId}
        onAgentIdChange={configProps.onAgentIdChange}
        customerId={customerId}
        onCustomerIdChange={configProps.onCustomerIdChange}
        selectedToken={configProps.selectedToken}
        onTokenSelect={configProps.onTokenSelect}
        availableAgents={configProps.availableAgents}
        isLoadingAgents={configProps.isLoadingAgents}
        agentError={configProps.agentError}
        onFetchAgents={configProps.onFetchAgents}
        onStartChat={handleApplyConfigAndClose}
        showStartButton={true}
        isChatActive={configProps.isChatActive}
        welcomeMessages={configProps.welcomeMessages}
        onWelcomeMessagesChange={configProps.onWelcomeMessagesChange}
        language={configProps.language}
        onLanguageChange={configProps.onLanguageChange}
        initialMode={configProps.initialMode}
        onInitialModeChange={configProps.onInitialModeChange}
        autoStartSession={configProps.autoStartSession}
        onAutoStartSessionChange={configProps.onAutoStartSessionChange}
      />

    </div>
  );
};
