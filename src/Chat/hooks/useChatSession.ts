/**
 * Custom hook for managing chat session creation and lifecycle
 * Follows ADR-004: Separation of Concerns - Business logic layer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ParlantClient } from 'parlant-client';
import { log, logWarn, logError } from '../utils/logger';
import type { EventCreationParams } from 'parlant-client/src/api';

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
 * Options for useChatSession hook
 */
interface UseChatSessionOptions {
  /** Server URL */
  serverUrl: string;
  /** Agent ID */
  agentId: string;
  /** Customer ID */
  customerId: string;
  /** Authentication token */
  authToken?: string;
  /** External session ID (if loading existing session) */
  externalSessionId?: string | null;
  /** Callback when session is created */
  onSessionCreated?: (sessionId: string) => void;
}

/**
 * Return value for useChatSession hook
 */
interface UseChatSessionReturn {
  /** Current session ID */
  sessionId: string | null;
  /** Whether session is being created */
  isCreatingSession: boolean;
  /** Error message if any */
  error: string;
  /** Create a new session */
  createSession: (message?: EventCreationParams) => Promise<void>;
  /** Set error message */
  setError: (error: string) => void;
}

/**
 * Custom hook for managing chat session creation and lifecycle
 * 
 * @param options - Session configuration options
 * @returns Session management functions and state
 * 
 * @example
 * ```tsx
 * const { sessionId, createSession, isCreatingSession } = useChatSession({
 *   serverUrl: 'https://api.example.com',
 *   agentId: 'agent-123',
 *   customerId: 'customer-456',
 *   authToken: 'token...',
 *   onSessionCreated: (id) => console.log('Session:', id)
 * });
 * ```
 */
export const useChatSession = ({
  serverUrl,
  agentId,
  customerId,
  authToken,
  externalSessionId,
  onSessionCreated
}: UseChatSessionOptions): UseChatSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(externalSessionId || null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const sessionCreatedRef = useRef<boolean>(false);

  // Create ParlantClient instance (memoized to avoid recreation)
  const parlantClientRef = useRef<ParlantClient | null>(null);
  if (!parlantClientRef.current) {
    parlantClientRef.current = new ParlantClient({
      environment: serverUrl
    });
  }

  // Handle external sessionId changes
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      log('Loading existing session:', externalSessionId);
      setSessionId(externalSessionId);
      sessionCreatedRef.current = true;
    }
  }, [externalSessionId, sessionId]);

  /**
   * Creates a new session
   */
  const createSession = useCallback(
    async (message?: EventCreationParams): Promise<void> => {
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
            const customers = await parlantClientRef.current!.customers.list();
            log('Available customers:', customers);

            const existingCustomer = customers.find((c) => c.name === customerId.trim());

            if (existingCustomer) {
              log('Found existing customer:', existingCustomer);
              sessionData.customer_id = existingCustomer.id;
            } else {
              log('Creating new customer:', customerId.trim());
              const newCustomer = await parlantClientRef.current!.customers.create({
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
          'Content-Type': 'application/json'
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          log('Using auth token for session creation');
        }

        const response = await fetch(`${serverUrl}/sessions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sessionData)
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
        onSessionCreated?.(newSession.id);

        if (message) {
          const messageHeaders: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (authToken) {
            messageHeaders['Authorization'] = `Bearer ${authToken}`;
          }

          const messageResponse = await fetch(`${serverUrl}/sessions/${newSession.id}/events`, {
            method: 'POST',
            headers: messageHeaders,
            body: JSON.stringify(message)
          });

          if (!messageResponse.ok) {
            const errorData = await messageResponse.json();
            logWarn('Failed to send initial message:', errorData);
          }
        }

        setIsCreatingSession(false);
      } catch (error) {
        const errorMessage = `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logError(errorMessage, error);
        setError(errorMessage);
        setIsCreatingSession(false);
        throw error;
      }
    },
    [agentId, customerId, serverUrl, isCreatingSession, onSessionCreated, authToken]
  );

  // Auto-create session on mount if needed
  useEffect(() => {
    if (!sessionId && !isCreatingSession && !sessionCreatedRef.current && !externalSessionId) {
      sessionCreatedRef.current = true;
      createSession().catch((error) => {
        logError('Failed to create session on mount:', error);
        sessionCreatedRef.current = false;
      });
    }
  }, [externalSessionId, sessionId, isCreatingSession, createSession]);

  return {
    sessionId,
    isCreatingSession,
    error,
    createSession,
    setError
  };
};

