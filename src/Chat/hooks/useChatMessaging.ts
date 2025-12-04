/**
 * Custom hook for managing chat messaging functionality
 * Follows ADR-004: Separation of Concerns - Business logic layer
 */

import { useState, useCallback, useRef } from 'react';
import { logError } from '../utils/logger';
import type { EventCreationParams } from 'parlant-client/src/api';

/**
 * Options for useChatMessaging hook
 */
interface UseChatMessagingOptions {
  /** Server URL */
  serverUrl: string;
  /** Session ID */
  sessionId: string | null;
  /** Authentication token */
  authToken?: string;
  /** Callback to create session */
  createSession: (message?: EventCreationParams) => Promise<void>;
}

/**
 * Return value for useChatMessaging hook
 */
interface UseChatMessagingReturn {
  /** Current input message */
  inputMessage: string;
  /** Set input message */
  setInputMessage: (message: string) => void;
  /** Send a message */
  sendMessage: () => Promise<void>;
  /** Handle key press */
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Custom hook for managing chat messaging functionality
 * 
 * @param options - Messaging configuration options
 * @returns Messaging functions and state
 * 
 * @example
 * ```tsx
 * const { inputMessage, setInputMessage, sendMessage } = useChatMessaging({
 *   serverUrl: 'https://api.example.com',
 *   sessionId: 'session-123',
 *   authToken: 'token...',
 *   createSession: createSessionFn
 * });
 * ```
 */
export const useChatMessaging = ({
  serverUrl,
  sessionId,
  authToken,
  createSession
}: UseChatMessagingOptions): UseChatMessagingReturn => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Sends a message
   */
  const postMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      const message: EventCreationParams = {
        kind: 'message',
        message: content,
        source: 'customer'
      };

      if (sessionId) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${serverUrl}/sessions/${sessionId}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(message)
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
    },
    [sessionId, serverUrl, createSession, authToken]
  );

  /**
   * Sends a message from the input field
   */
  const sendMessage = useCallback(async (): Promise<void> => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    try {
      await postMessage(messageText);
    } catch (error) {
      logError('Failed to send message:', error);
      throw error;
    }
  }, [inputMessage, postMessage]);

  /**
   * Handles key press events in the input field
   */
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    inputMessage,
    setInputMessage,
    sendMessage,
    handleKeyPress
  };
};

