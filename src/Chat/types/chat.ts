/**
 * Shared types and interfaces for chat components
 */

/**
 * Polling configuration interface
 */
export interface PollingConfig {
  /** Fast polling when bot is processing/typing (default: 500ms) */
  active?: number;
  /** Normal polling (default: 1000ms) */
  normal?: number;
  /** Slow polling when idle (default: 3000ms) */
  idle?: number;
  /** Very slow polling when very idle (default: 5000ms) */
  veryIdle?: number;
  /** Time before switching to idle polling (default: 10000ms) */
  idleThreshold?: number;
  /** Time before switching to very idle polling (default: 30000ms) */
  veryIdleThreshold?: number;
}

/**
 * Customer information interface
 */
export interface CustomerInfo {
  customerId: string;
  customerName?: string;
}

/**
 * Session callbacks interface
 */
export interface SessionCallbacks {
  /** Callback when a session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when session is updated */
  onSessionUpdate?: (sessionId: string | null) => void;
  /** Callback when welcome message is shown */
  onWelcomeShown?: () => void;
}

/**
 * Chat configuration interface (core props shared across all chat components)
 */
export interface ChatConfig {
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
  language?: 'da' | 'en';
}

