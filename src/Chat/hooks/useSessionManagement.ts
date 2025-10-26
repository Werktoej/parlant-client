/**
 * Custom hook for session management
 */

import { useState, useCallback, useRef } from 'react';
import { SessionService, type Session, type SessionCreationData } from '../services/SessionService';
import { logError } from '../utils/logger';

/**
 * Interface for session management hook options
 */
interface UseSessionManagementOptions {
  serverUrl: string;
  authToken?: string;
  customerId: string;
  onSessionCreated?: (sessionId: string) => void;
}

/**
 * Interface for session management hook return value
 */
interface UseSessionManagementReturn {
  sessions: Session[];
  loading: boolean;
  error: string;
  selectedSessionId: string | null;
  isCreatingSession: boolean;
  fetchSessions: () => Promise<void>;
  createSession: (sessionData: SessionCreationData) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  selectSession: (sessionId: string | null) => void;
  refreshSessions: () => Promise<void>;
}

/**
 * Custom hook for managing chat sessions
 * @param options - Hook configuration options
 * @returns Session management functions and state
 */
export const useSessionManagement = ({
  serverUrl,
  authToken,
  customerId,
  onSessionCreated
}: UseSessionManagementOptions): UseSessionManagementReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  const sessionServiceRef = useRef<SessionService | undefined>(undefined);

  // Initialize session service
  if (!sessionServiceRef.current) {
    sessionServiceRef.current = new SessionService(serverUrl, authToken);
  }

  /**
   * Fetches sessions from the server
   */
  const fetchSessions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const fetchedSessions = await sessionServiceRef.current!.fetchSessions(customerId);

      // Sort by date descending (most recent first)
      fetchedSessions.sort((a: Session, b: Session) => {
        const aDate = new Date(a.updated_at || a.created_at).getTime();
        const bDate = new Date(b.updated_at || b.created_at).getTime();
        return bDate - aDate;
      });

      setSessions(fetchedSessions);
    } catch (err) {
      logError('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  /**
   * Creates a new session
   */
  const createSession = useCallback(async (sessionData: SessionCreationData): Promise<Session> => {
    try {
      setIsCreatingSession(true);
      setError('');

      const newSession = await sessionServiceRef.current!.createSession(sessionData);

      if (!newSession?.id) {
        throw new Error('Session was not created - no ID returned');
      }

      setSelectedSessionId(newSession.id);
      onSessionCreated?.(newSession.id);

      // Refresh sessions list
      await fetchSessions();

      return newSession;
    } catch (error) {
      const errorMessage = `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      throw error;
    } finally {
      setIsCreatingSession(false);
    }
  }, [onSessionCreated, fetchSessions]);

  /**
   * Deletes a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await sessionServiceRef.current!.deleteSession(sessionId);

      // Remove from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // Clear selection if deleted session was selected
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
    } catch (err) {
      logError('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, [selectedSessionId]);

  /**
   * Selects a session
   */
  const selectSession = useCallback((sessionId: string | null): void => {
    setSelectedSessionId(sessionId);
  }, []);

  /**
   * Refreshes the sessions list
   */
  const refreshSessions = useCallback(async (): Promise<void> => {
    await fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    selectedSessionId,
    isCreatingSession,
    fetchSessions,
    createSession,
    deleteSession,
    selectSession,
    refreshSessions
  };
};
