import { ParlantClient } from 'parlant-client';
import { log, logError } from '../utils/logger';
import type { Event } from 'parlant-client/src/api';
import {
  extractMessage as getMessageFromData,
  extractStatus as getStatusFromData,
  extractParticipant as getParticipantFromData
} from '../types/parlant';

/**
 * Interface for chat messages displayed in the UI
 */
export interface ChatMessage {
  id: string;
  content: string;
  source: 'customer' | 'ai_agent' | 'human_agent';
  timestamp: Date;
  agentName?: string;
}

/**
 * Interface for chat status updates
 */
export interface ChatStatus {
  status: 'ready' | 'processing' | 'typing' | 'error';
  message?: string;
}

/**
 * Event handlers for the ParlantChat class
 */
export interface ParlantChatEventHandlers {
  onMessage: (message: ChatMessage) => void;
  onStatusUpdate: (status: ChatStatus) => void;
  onError: (error: string) => void;
}

/**
 * Custom ParlantChat class for managing chat sessions and real-time communication
 * with the Parlant server using the parlant-client library
 */
export class ParlantChat {
  private client: ParlantClient;
  private sessionId: string | null = null;
  private lastOffset: number = 0;
  private eventHandlers: ParlantChatEventHandlers;
  private isMonitoring: boolean = false;
  private monitoringController: AbortController | null = null;

  /**
   * Creates a new ParlantChat instance
   * @param serverUrl - The URL of the Parlant server
   * @param eventHandlers - Event handlers for messages, status updates, and errors
   */
  constructor(serverUrl: string, eventHandlers: ParlantChatEventHandlers) {
    this.client = new ParlantClient({
      environment: serverUrl
    });
    this.eventHandlers = eventHandlers;
  }

  /**
   * Creates a new chat session with the specified agent and customer
   * @param agentId - The ID of the agent to chat with
   * @param customerId - The ID of the customer (optional)
   * @returns Promise resolving to the session ID
   */
  async createSession(agentId: string, customerId?: string): Promise<string> {
    try {
      const session = await this.client.sessions.create({
        agentId: agentId,
        customerId: customerId,
        title: `Chat Session ${new Date().toLocaleString()}`
      });

      this.sessionId = session.id;
      log('Session created:', this.sessionId);

      // Start monitoring for events
      this.startEventMonitoring();

      return this.sessionId;
    } catch (error) {
      const errorMessage = `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logError(errorMessage, error);
      this.eventHandlers.onError(errorMessage);
      throw error;
    }
  }

  /**
   * Sends a message from the customer to the agent
   * @param message - The message content to send
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      await this.client.sessions.createEvent(this.sessionId, {
        kind: "message",
        source: "customer",
        message: message
      });

      log('Message sent:', message);
    } catch (error) {
      const errorMessage = `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logError(errorMessage, error);
      this.eventHandlers.onError(errorMessage);
      throw error;
    }
  }

  /**
   * Starts monitoring session events using long polling
   * @private
   */
  private async startEventMonitoring(): Promise<void> {
    if (!this.sessionId || this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringController = new AbortController();

    while (this.isMonitoring && this.sessionId) {
      try {
        // Poll for new events with long polling
        const events = await this.client.sessions.listEvents(this.sessionId, {
          minOffset: this.lastOffset,
          waitForData: 30, // Wait up to 30 seconds for new events
          kinds: "message,status", // Only get message and status events
        });

        // Process each event
        for (const event of events) {
          await this.handleEvent(event);
          this.lastOffset = Math.max(this.lastOffset, event.offset + 1);
        }

      } catch (error) {
        if (this.monitoringController?.signal.aborted) {
          log('Event monitoring stopped');
          break;
        }

        logError('Event monitoring error:', error);
        this.eventHandlers.onError(`Event monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Handles individual events from the Parlant session
   * @param event - The event to handle
   * @private
   */
  private async handleEvent(event: Event): Promise<void> {
    try {
      if (event.kind === "message") {
        this.handleMessageEvent(event);
      } else if (event.kind === "status") {
        this.handleStatusEvent(event);
      }
    } catch (error) {
      logError('Error handling event:', error);
      this.eventHandlers.onError(`Error handling event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles message events from the session
   * @param event - The message event
   * @private
   */
  private handleMessageEvent(event: Event): void {
    const eventData = event.data as Record<string, unknown>;
    const message: ChatMessage = {
      id: `${event.offset}-${Date.now()}`,
      content: getMessageFromData(eventData),
      source: event.source as 'customer' | 'ai_agent' | 'human_agent',
      timestamp: new Date(event.creationUtc || Date.now()),
      agentName: getParticipantFromData(eventData)?.display_name
    };

    this.eventHandlers.onMessage(message);
  }

  /**
   * Handles status events from the session
   * @param event - The status event
   * @private
   */
  private handleStatusEvent(event: Event): void {
    const eventData = event.data as Record<string, unknown>;
    const statusType = getStatusFromData(eventData);
    const status: ChatStatus = {
      status: statusType,
      message: this.getStatusMessage(statusType)
    };

    this.eventHandlers.onStatusUpdate(status);
  }

  /**
   * Gets a user-friendly status message for the given status
   * @param status - The status from the event
   * @returns A user-friendly status message
   * @private
   */
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'processing':
        return 'Agent is thinking...';
      case 'typing':
        return 'Agent is typing...';
      case 'ready':
        return '';
      case 'error':
        return 'An error occurred';
      default:
        return status;
    }
  }

  /**
   * Stops event monitoring and cleans up resources
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringController) {
      this.monitoringController.abort();
      this.monitoringController = null;
    }
  }

  /**
   * Ends the current session and stops monitoring
   */
  public async endSession(): Promise<void> {
    this.stopMonitoring();
    this.sessionId = null;
    this.lastOffset = 0;
  }

  /**
   * Gets the current session ID
   * @returns The current session ID or null if no session is active
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Checks if there's an active session
   * @returns True if there's an active session, false otherwise
   */
  public hasActiveSession(): boolean {
    return this.sessionId !== null;
  }
}
