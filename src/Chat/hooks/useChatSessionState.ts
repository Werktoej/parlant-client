/**
 * Custom hook for managing chat session state
 * Follows ADR-004: Separation of Concerns - State management layer
 */

import { useState, useEffect, useCallback } from 'react';
import { log } from '../utils/logger';

/**
 * Options for useChatSessionState hook
 */
interface UseChatSessionStateOptions {
  /** Agent ID */
  agentId: string;
  /** Customer ID */
  customerId: string;
  /** Callback when session is created */
  onSessionCreated?: (sessionId: string) => void;
}

/**
 * Return value for useChatSessionState hook
 */
interface UseChatSessionStateReturn {
  /** Current session ID */
  currentSessionId: string | null;
  /** Session key for forcing re-mount */
  sessionKey: number;
  /** Handle session creation */
  handleSessionCreated: (sessionId: string) => void;
  /** Handle session update */
  handleSessionUpdate: (sessionId: string | null) => void;
}

/**
 * Custom hook for managing chat session state
 * 
 * @param options - Session state configuration options
 * @returns Session state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   currentSessionId,
 *   sessionKey,
 *   handleSessionCreated
 * } = useChatSessionState({
 *   agentId: 'agent-123',
 *   customerId: 'customer-456',
 *   onSessionCreated: (id) => console.log('Session:', id)
 * });
 * ```
 */
export const useChatSessionState = ({
  agentId,
  customerId,
  onSessionCreated
}: UseChatSessionStateOptions): UseChatSessionStateReturn => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(0);

  // Clear session and messages when agent or customer changes
  useEffect(() => {
    if (currentSessionId) {
      log('Agent or customer changed - clearing session and message history', {
        agentId,
        customerId
      });
      setCurrentSessionId(null);
      setSessionKey((prev) => prev + 1); // Force re-mount of chat components
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, customerId]);

  /**
   * Handles when a new session is created
   */
  const handleSessionCreated = useCallback(
    (sessionId: string) => {
      setCurrentSessionId(sessionId);
      onSessionCreated?.(sessionId);
      log('Session created:', sessionId);
    },
    [onSessionCreated]
  );

  /**
   * Handles updating session (including clearing)
   */
  const handleSessionUpdate = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    log('Session updated:', sessionId);
  }, []);

  return {
    currentSessionId,
    sessionKey,
    handleSessionCreated,
    handleSessionUpdate
  };
};

