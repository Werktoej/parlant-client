import React from 'react';
import { X, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { useTranslation, type Language } from '../hooks/useTranslation';
import { ChatInterface } from './ChatInterface';
import type { PollingConfig } from '../types/chat';

/**
 * Props for the ChatWindow component
 */
interface ChatWindowProps {
  /** The URL of the Parlant server */
  serverUrl: string;
  /** The agent ID to use for the chat */
  agentId: string;
  /** The customer ID for the chat session */
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
  /** Shared session ID from parent */
  sessionId?: string | null;
  /** Whether welcome message has been shown */
  hasShownWelcome?: boolean;
  /** Callback when a session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when welcome message is shown */
  onWelcomeShown?: () => void;
  /** Callback when chat is closed */
  onClose?: () => void;
  /** Callback when expand to full screen is requested */
  onExpand?: () => void;
  /** Callback when contract from full screen is requested */
  onContract?: () => void;
  /** Callback when sessions toggle button is clicked */
  onToggleSessions?: () => void;
  /** Layout mode for the chatbot */
  layoutMode?: 'popup' | 'fullscreen';
  /** Custom polling intervals for adaptive polling (optional) */
  pollingConfig?: PollingConfig;
  /** Whether to show "Powered by Parlant" attribution (default: false) */
  showAttribution?: boolean;
  /** Welcome messages per language to send when creating a new session (optional) */
  welcomeMessages?: Record<'da' | 'en', string>;
}

/**
 * Chat window component that provides a complete chat interface
 * using the shared ChatInterface component with a styled header.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  serverUrl,
  agentId,
  customerId,
  customerName,
  agentName,
  authToken,
  scrollToNewMessage = true,
  language = 'en',
  sessionId,
  hasShownWelcome,
  onSessionCreated,
  onWelcomeShown,
  onClose,
  onExpand,
  onContract,
  onToggleSessions,
  layoutMode = 'popup',
  pollingConfig,
  showAttribution = true,
  welcomeMessages
}) => {
  const { t } = useTranslation(language);

  // Use translated agent name if not provided
  const displayAgentName = agentName || t('agent.defaultName');

  /**
   * Handles closing the chatbot
   */
  const handleClose = (): void => {
    onClose?.();
  };

  return (
    <div className={`flex flex-col h-full bg-white overflow-hidden border border-gray-100 ${layoutMode === 'popup'
      ? 'rounded-3xl shadow-2xl'
      : 'shadow-2xl'
      }`}>
      {/* Chat Header */}
      <div className={`bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4 sm:p-6 flex items-center justify-between relative overflow-hidden ${layoutMode === 'popup' ? 'rounded-t-3xl' : ''
        }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-lg sm:text-xl">F</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-lg sm:text-xl truncate">{displayAgentName}</h3>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-white/90 text-xs sm:text-sm font-medium">{t('status.connected')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 relative z-10 flex-shrink-0">
          {layoutMode === 'fullscreen' && onToggleSessions && (
            <button
              onClick={onToggleSessions}
              className="hidden md:inline-flex items-center justify-center text-white/80 hover:text-white p-2 sm:p-3 hover:bg-white/15 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              title="Toggle Sessions"
            >
              <MessageSquare size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
          {layoutMode === 'popup' && onExpand && (
            <button
              onClick={onExpand}
              className="inline-flex items-center justify-center text-white/80 hover:text-white p-2 sm:p-3 hover:bg-white/15 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              title={t('common.expand')}
            >
              <Maximize2 size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
          {layoutMode === 'fullscreen' && onContract && (
            <button
              onClick={onContract}
              className="hidden md:inline-flex items-center justify-center text-white/80 hover:text-white p-2 sm:p-3 hover:bg-white/15 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              title="Exit Full Screen"
            >
              <Minimize2 size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={handleClose}
              className={`text-white/80 hover:text-white p-2 sm:p-3 hover:bg-white/15 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20 ${layoutMode === 'fullscreen' ? 'hidden md:inline-flex' : 'inline-flex'
                } items-center justify-center`}
              title={t('common.close')}
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatInterface
          serverUrl={serverUrl}
          agentId={agentId}
          customerId={customerId}
          customerName={customerName}
          agentName={displayAgentName}
          authToken={authToken}
          scrollToNewMessage={scrollToNewMessage}
          language={language}
          sessionId={sessionId}
          hasShownWelcome={hasShownWelcome}
          onSessionCreated={onSessionCreated}
          onWelcomeShown={onWelcomeShown}
          pollingConfig={pollingConfig}
          showAttribution={showAttribution}
          welcomeMessages={welcomeMessages}
        />
      </div>
    </div>
  );
};
