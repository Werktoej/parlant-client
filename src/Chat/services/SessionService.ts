/**
 * Service for managing chat sessions with the Parlant API
 */

import { makeAuthenticatedRequest, createUrlWithParams } from '../utils/http';
import { logWarn } from '../utils/logger';
import type { ParlantEvent, MessageCreationParams } from '../types/parlant';

/**
 * Interface for a chat session
 */
export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  agent_id: string;
}

/**
 * Interface for session creation data
 */
export interface SessionCreationData {
  agent_id: string;
  customer_id?: string;
  allow_greeting?: boolean;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service class for session operations
 */
export class SessionService {
  private serverUrl: string;
  private authToken?: string;

  constructor(serverUrl: string, authToken?: string) {
    this.serverUrl = serverUrl;
    this.authToken = authToken;
  }

  /**
   * Fetches sessions for a specific customer
   * @param customerId - Customer ID to filter sessions
   * @returns Promise resolving to array of sessions
   */
  async fetchSessions(customerId: string): Promise<Session[]> {
    const url = createUrlWithParams(`${this.serverUrl}/sessions`, {
      customer_id: customerId
    });

    return makeAuthenticatedRequest<Session[]>(url, {}, this.authToken);
  }

  /**
   * Creates a new session
   * @param sessionData - Session creation data
   * @returns Promise resolving to created session
   */
  async createSession(sessionData: SessionCreationData): Promise<Session> {
    return makeAuthenticatedRequest<Session>(
      `${this.serverUrl}/sessions`,
      {
        method: 'POST',
        body: sessionData
      },
      this.authToken
    );
  }

  /**
   * Deletes a session
   * @param sessionId - ID of session to delete
   * @returns Promise resolving when deletion is complete
   */
  async deleteSession(sessionId: string): Promise<void> {
    await makeAuthenticatedRequest(
      `${this.serverUrl}/sessions/${sessionId}`,
      { method: 'DELETE' },
      this.authToken
    );
  }

  /**
   * Fetches events for a session
   * @param sessionId - Session ID
   * @param minOffset - Minimum offset for polling
   * @param waitForData - Seconds to wait for new data
   * @returns Promise resolving to array of events
   */
  async fetchEvents(
    sessionId: string,
    minOffset: number = 0,
    waitForData: number = 60
  ): Promise<ParlantEvent[]> {
    const url = createUrlWithParams(`${this.serverUrl}/sessions/${sessionId}/events`, {
      min_offset: minOffset,
      wait_for_data: waitForData
    });

    // Set timeout to be longer than waitForData to allow server to respond
    // Add 10 seconds buffer for network latency and processing
    const timeoutMs = (waitForData + 10) * 1000;

    return makeAuthenticatedRequest<ParlantEvent[]>(
      url,
      { timeout: timeoutMs },
      this.authToken
    );
  }

  /**
   * Sends a message to a session
   * @param sessionId - Session ID
   * @param message - Message data
   * @returns Promise resolving to created event
   */
  async sendMessage(sessionId: string, message: MessageCreationParams): Promise<ParlantEvent> {
    return makeAuthenticatedRequest<ParlantEvent>(
      `${this.serverUrl}/sessions/${sessionId}/events`,
      {
        method: 'POST',
        body: message
      },
      this.authToken
    );
  }

  /**
   * Checks backend connectivity
   * @returns Promise resolving to boolean indicating if backend is online
   */
  async pingBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await makeAuthenticatedRequest(
        `${this.serverUrl}/agents`,
        { signal: controller.signal },
        this.authToken
      );

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      logWarn('Backend ping failed:', error);
      return false;
    }
  }
}
