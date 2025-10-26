import { ParlantClient } from 'parlant-client';
import type { Event, EventCreationParams } from 'parlant-client/src/api';
import { log, logWarn, logError } from '../utils/logger';
import type {
  ParlantCustomer,
  ParlantSession,
  SessionCreationParams,
} from '../types/parlant';
import { extractMessage as getMessageFromData, extractStatus as getStatusFromData, extractParticipant as getParticipantFromData } from '../types/parlant';

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
 * Event handlers for the SimpleParlantChat class
 */
export interface SimpleParlantChatEventHandlers {
  onMessage: (message: ChatMessage) => void;
  onStatusUpdate: (status: ChatStatus) => void;
  onError: (error: string) => void;
}

/**
 * ParlantChat class using the official ParlantClient
 * Following the exact pattern from the working example
 */
export class SimpleParlantChat {
  private parlantClient: ParlantClient;
  private sessionId: string | null = null;
  private lastOffset: number = 0;
  private eventHandlers: SimpleParlantChatEventHandlers;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new SimpleParlantChat instance
   * @param serverUrl - The URL of the Parlant server
   * @param eventHandlers - Event handlers for messages, status updates, and errors
   */
  constructor(serverUrl: string, eventHandlers: SimpleParlantChatEventHandlers) {
    // Use the official ParlantClient exactly like the working example
    this.parlantClient = new ParlantClient({
      environment: serverUrl
    });
    this.eventHandlers = eventHandlers;
  }

  /**
   * Ensures a customer exists, creating one if necessary
   * @param customerId - The customer ID from frontend
   * @returns The Parlant customer ID to use in session
   * @private
   */
  private async ensureCustomerExists(customerId: string): Promise<string> {
    try {
      log('Checking if customer exists:', customerId);

      // Try to get the customer first using ParlantClient
      const customer = await this.parlantClient.customers.retrieve(customerId);
      log('Customer exists:', customer);
      return customer.id; // Return the Parlant customer ID
    } catch (error: unknown) {
      const isNotFoundError = error && typeof error === 'object' &&
        ('status' in error && (error as { status?: number }).status === 404 ||
          'statusCode' in error && (error as { statusCode?: number }).statusCode === 404);

      if (isNotFoundError) {
        // Customer doesn't exist, create it
        log('Customer not found, creating:', customerId);
        const newCustomer = await this.createCustomer(customerId);
        log('Customer created:', newCustomer);
        return newCustomer.id; // Return the new Parlant customer ID
      }

      // Some other error occurred
      logError('Error checking customer:', error);
      throw error;
    }
  }

  /**
   * Creates a new customer using ParlantClient
   * @param customerId - The customer ID from frontend
   * @returns The created customer object
   * @private
   */
  private async createCustomer(customerId: string): Promise<ParlantCustomer> {
    const customerData = {
      name: customerId,
      tags: []
    };

    log('Creating customer with ParlantClient:', customerData);

    try {
      // Use ParlantClient to create customer
      const createdCustomer = await this.parlantClient.customers.create(customerData);
      log('Customer created successfully:', createdCustomer);
      return createdCustomer as ParlantCustomer;
    } catch (error) {
      logError('Customer creation failed:', error);
      throw error;
    }
  }

  /**
   * Creates a new chat session with the specified agent
   * Following the exact pattern from the working example + customer creation
   * @param agentId - The ID of the agent to chat with
   * @param customerId - The customer ID from frontend (optional)
   * @returns Promise resolving to the session ID
   */
  async createSession(agentId: string, customerId?: string): Promise<string> {
    log('=== CREATE SESSION CALLED ===');
    log('AgentId:', agentId);
    log('CustomerId:', customerId);

    try {
      // Use the exact same pattern as the working example
      const sessionData: SessionCreationParams = {
        agentId: agentId,
        allowGreeting: false,
        title: `Chat Session ${new Date().toISOString()}`
      };

      // Handle customer creation if customerId is provided
      if (customerId && customerId.trim()) {
        try {
          const parlantCustomerId = await this.ensureCustomerExists(customerId.trim());
          sessionData.customerId = parlantCustomerId;
          log('Using Parlant customer ID in session:', parlantCustomerId);
        } catch (customerError) {
          logWarn('Failed to create/verify customer, proceeding with guest session:', customerError);
          // Continue without customerId - creates guest session like the example
        }
      } else {
        log('No customer ID provided, creating guest session like example');
      }

      log('Creating session with ParlantClient:', sessionData);

      // Use the official ParlantClient exactly like the working example
      const newSession = await this.parlantClient.sessions.create(sessionData) as unknown as ParlantSession;

      if (!newSession?.id) {
        throw new Error('Session was not created - no ID returned');
      }

      this.sessionId = newSession.id;
      log('Session created successfully:', this.sessionId);

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
      const messageData: EventCreationParams = {
        kind: "message",
        source: "customer",
        message: message
      };

      log('Sending message with ParlantClient:', messageData);

      // Use the official ParlantClient exactly like the working example
      const event = await this.parlantClient.sessions.createEvent(this.sessionId, messageData);

      log('Message sent successfully:', event);
    } catch (error) {
      const errorMessage = `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logError(errorMessage, error);
      this.eventHandlers.onError(errorMessage);
      throw error;
    }
  }

  /**
   * Starts monitoring session events using the official ParlantClient
   * Following the exact pattern from the working example
   * @private
   */
  private startEventMonitoring(): void {
    if (!this.sessionId || this.isMonitoring) {
      log('Event monitoring already active or no session');
      return;
    }

    log('Starting event monitoring for session:', this.sessionId);
    this.isMonitoring = true;

    // Use polling similar to how React Query works in the example
    this.monitorEvents();
  }

  /**
   * Main event monitoring loop using ParlantClient
   * @private
   */
  private async monitorEvents(): Promise<void> {
    if (!this.sessionId || !this.isMonitoring) return;

    try {
      log('Polling for events from offset:', this.lastOffset);

      // Use the official ParlantClient exactly like the working example
      const events = await this.parlantClient.sessions.listEvents(this.sessionId, {
        waitForData: 60, // Match the example: 60 seconds
        minOffset: this.lastOffset
      });

      if (events && events.length > 0) {
        log('Received events:', events);

        // Process each event
        for (const event of events) {
          if (!this.isMonitoring) break;
          log('Processing event:', event);
          await this.handleEvent(event);
          this.lastOffset = Math.max(this.lastOffset, event.offset + 1);
        }
      }

      // Continue monitoring if still active
      if (this.isMonitoring) {
        // Use a short delay before next poll
        this.monitoringInterval = setTimeout(() => {
          this.monitorEvents();
        }, 1000);
      }

    } catch (error) {
      if (!this.isMonitoring) {
        log('Event monitoring stopped gracefully');
        return;
      }

      logError('Event monitoring error:', error);

      if (this.isMonitoring) {
        this.eventHandlers.onError(`Event monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Retry after a delay
        this.monitoringInterval = setTimeout(() => {
          this.monitorEvents();
        }, 5000);
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
    log('Stopping event monitoring');
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
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