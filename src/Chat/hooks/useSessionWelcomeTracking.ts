/**
 * Custom hook for tracking which sessions have shown welcome messages
 * Extracts duplicate logic from ParlantChatBot
 */

import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/ui';
import { logWarn } from '../utils/logger';

/**
 * Hook for managing session welcome message tracking
 * @returns Object with session welcome tracking state and functions
 */
export const useSessionWelcomeTracking = () => {
  const [sessionsWithWelcome, setSessionsWithWelcome] = useState<Set<string>>(() => {
    // Load sessions with welcome from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS_WITH_WELCOME);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      logWarn('Failed to load sessions welcome state:', error);
    }
    return new Set();
  });

  /**
   * Marks a session as having shown the welcome message
   * @param sessionId - The session ID to mark
   */
  const markWelcomeShown = useCallback((sessionId: string) => {
    setSessionsWithWelcome(prev => {
      if (prev.has(sessionId)) {
        return prev; // Already marked, no change
      }

      const newSet = new Set(prev).add(sessionId);

      // Persist to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.SESSIONS_WITH_WELCOME,
          JSON.stringify(Array.from(newSet))
        );
      } catch (error) {
        logWarn('Failed to save sessions welcome state:', error);
      }

      return newSet;
    });
  }, []);

  /**
   * Checks if a session has shown the welcome message
   * @param sessionId - The session ID to check
   * @returns True if welcome was shown for this session
   */
  const hasShownWelcome = useCallback((sessionId: string | null): boolean => {
    if (!sessionId) return false;
    return sessionsWithWelcome.has(sessionId);
  }, [sessionsWithWelcome]);

  /**
   * Clears the welcome tracking for a specific session
   * @param sessionId - The session ID to clear
   */
  const clearWelcomeForSession = useCallback((sessionId: string) => {
    setSessionsWithWelcome(prev => {
      if (!prev.has(sessionId)) {
        return prev; // Not present, no change
      }

      const newSet = new Set(prev);
      newSet.delete(sessionId);

      // Persist to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.SESSIONS_WITH_WELCOME,
          JSON.stringify(Array.from(newSet))
        );
      } catch (error) {
        logWarn('Failed to save sessions welcome state:', error);
      }

      return newSet;
    });
  }, []);

  return {
    sessionsWithWelcome,
    markWelcomeShown,
    hasShownWelcome,
    clearWelcomeForSession,
  };
};

