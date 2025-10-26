/**
 * Type definitions for Parlant API entities
 * These types are based on the parlant-client library
 */

/**
 * Message source types
 */
export type MessageSource = 'customer' | 'ai_agent' | 'human_agent';

/**
 * Event kind types
 */
export type EventKind = 'message' | 'status' | 'action' | 'error';

/**
 * Status types
 */
export type StatusType = 'ready' | 'processing' | 'typing' | 'error';

/**
 * Parlant customer entity
 */
export interface ParlantCustomer {
    id: string;
    name: string;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Parlant session entity
 */
export interface ParlantSession {
    id: string;
    agent_id: string;
    customer_id?: string;
    title: string;
    created_at: string;
    updated_at: string;
    allow_greeting?: boolean;
}

/**
 * Participant in an event
 */
export interface EventParticipant {
    display_name?: string;
    id?: string;
}

/**
 * Message event data
 */
export interface MessageEventData {
    message: string;
    participant?: EventParticipant;
}

/**
 * Status event data
 */
export interface StatusEventData {
    status: StatusType;
    message?: string;
}

/**
 * Generic event data (union of all possible event data types)
 */
export type EventData = MessageEventData | StatusEventData | Record<string, unknown>;

/**
 * Parlant event entity
 */
export interface ParlantEvent {
    id?: string;
    kind: EventKind;
    source: MessageSource;
    offset: number;
    correlation_id?: string;
    creation_utc: string;
    data: EventData;
    deleted?: boolean;
}

/**
 * Session creation parameters
 */
export interface SessionCreationParams {
    agentId: string;
    customerId?: string;
    allowGreeting?: boolean;
    title?: string;
}

/**
 * Event creation parameters for messages
 */
export interface MessageCreationParams {
    kind: 'message';
    source: MessageSource;
    message: string;
}

/**
 * Type guard to check if event data is MessageEventData
 */
export function isMessageEventData(data: EventData): data is MessageEventData {
    return 'message' in data;
}

/**
 * Type guard to check if event data is StatusEventData
 */
export function isStatusEventData(data: EventData): data is StatusEventData {
    return 'status' in data;
}

/**
 * Safely extract message from event data
 */
export function extractMessage(data: EventData): string {
    if (isMessageEventData(data)) {
        return data.message;
    }
    return '';
}

/**
 * Safely extract status from event data
 */
export function extractStatus(data: EventData): StatusType {
    if (isStatusEventData(data)) {
        return data.status;
    }
    return 'ready';
}

/**
 * Safely extract participant from event data
 */
export function extractParticipant(data: EventData): EventParticipant | undefined {
    if (isMessageEventData(data)) {
        return data.participant;
    }
    return undefined;
}

