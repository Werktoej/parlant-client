/**
 * Custom hook for message processing and status management
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { groupBy } from '../utils/object';
import { parseDate } from '../utils/date';
import type { ParlantEvent } from '../types/parlant';

/**
 * Interface for message with status
 */
export interface MessageInterface {
  id?: string;
  kind: string;
  source: string;
  creationUtc: Date;
  offset: number;
  correlationId: string;
  data: Record<string, unknown>;
  status: string | null;
  error?: string;
  isStatusMessage?: boolean;
  serverStatus?: string;
  created_at?: string;
}

/**
 * Interface for status event data
 */
interface StatusEventData {
  status?: string;
  exception?: string;
  data?: {
    stage?: string;
  };
}

/**
 * Interface for pending message
 */
export interface PendingMessage {
  id?: string;
  kind: string;
  source: string;
  creationUtc: Date;
  serverStatus: string;
  offset: number;
  correlationId: string;
  data: { message: string };
  status: null;
}

/**
 * Message processing hook options
 */
interface UseMessageProcessingOptions {
  t: (key: string, params?: Record<string, string>) => string;
}

/**
 * Message processing hook return value
 */
interface UseMessageProcessingReturn {
  messages: MessageInterface[];
  statusMessage: MessageInterface | null;
  pendingMessage: PendingMessage;
  setPendingMessage: (message: Partial<PendingMessage>) => void;
  clearPendingMessage: () => void;
  processEvents: (events: ParlantEvent[]) => void;
  addPendingMessage: (content: string) => void;
}

/**
 * Custom hook for processing messages and managing status
 * @param options - Hook configuration
 * @returns Message processing functions and state
 */
export const useMessageProcessing = ({
  t
}: UseMessageProcessingOptions): UseMessageProcessingReturn => {
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [statusMessage, setStatusMessage] = useState<MessageInterface | null>(null);
  const [events, setEvents] = useState<ParlantEvent[]>([]);
  const [pendingMessage, setPendingMessageState] = useState<PendingMessage>({
    kind: 'message',
    source: 'customer',
    creationUtc: new Date(),
    serverStatus: 'pending',
    offset: 0,
    correlationId: '',
    data: { message: '' },
    status: null,
  });

  // Group events by correlation ID
  const correlationsMap = useMemo(
    () => groupBy(events || [], (item: ParlantEvent) => item?.correlation_id?.split('::')[0] || 'unknown'),
    [events]
  );

  // Filter message events
  const messageEvents = useMemo(
    () => events?.filter((e) => e.kind === 'message') || [],
    [events]
  );

  // Add status to messages
  const withStatusMessages = useMemo(() => messageEvents.map((newMessage, i) => {
    const messageData: MessageInterface = {
      id: newMessage.id,
      kind: newMessage.kind,
      source: newMessage.source,
      creationUtc: parseDate(newMessage.creation_utc),
      offset: newMessage.offset,
      correlationId: newMessage.correlation_id || '',
      data: newMessage.data as Record<string, unknown>,
      status: '',
    };
    const correlationKey = newMessage?.correlation_id?.split('::')[0] || 'unknown';
    const correlationItems = correlationsMap[correlationKey];
    const lastCorrelationItem = (correlationItems?.at(-1)?.data) as StatusEventData | undefined;
    messageData.status = lastCorrelationItem?.status || (messageEvents[i + 1] ? 'ready' : null);
    if (messageData.status === 'error') {
      messageData.error = lastCorrelationItem?.exception;
    }
    return messageData;
  }), [messageEvents, correlationsMap]);

  // Track if we should clear pending message
  const [shouldClearPending, setShouldClearPending] = useState(false);

  // Update messages whenever withStatusMessages changes
  useEffect(() => {
    setMessages(prevMessages => {
      // Create a map of existing messages by ID for deduplication
      const existingIds = new Set(prevMessages.filter(m => m.id).map(m => m.id));

      // Check if there's a new customer message that matches pending
      const pendingMessageText = pendingMessage?.data?.message;
      if (pendingMessageText) {
        const matchingServerMessage = withStatusMessages.find(msg =>
          msg.id &&
          msg.source === 'customer' &&
          (msg.data as Record<string, unknown>)?.message === pendingMessageText &&
          !existingIds.has(msg.id)
        );

        if (matchingServerMessage) {
          setShouldClearPending(true);
        }
      }

      // Check for new bot messages
      const hasNewBotMessage = withStatusMessages.some(msg =>
        msg.id &&
        msg.source === 'ai_agent' &&
        !existingIds.has(msg.id)
      );

      // Clear status message if new bot message arrived
      if (hasNewBotMessage) {
        setStatusMessage(null);
      }

      // Merge messages, avoiding duplicates
      const messageMap = new Map<string, MessageInterface>();

      // Add existing messages (only those with IDs)
      prevMessages.forEach(msg => {
        if (msg.id) messageMap.set(msg.id, msg);
      });

      // Add/update with new messages (only those with IDs)
      withStatusMessages.forEach(msg => {
        if (msg.id) messageMap.set(msg.id, msg);
      });

      // Convert back to array, sorted by offset
      return Array.from(messageMap.values()).sort((a, b) => a.offset - b.offset);
    });
  }, [withStatusMessages, pendingMessage]);

  /**
   * Sets pending message with partial updates
   */
  const setPendingMessage = useCallback((message: Partial<PendingMessage>): void => {
    setPendingMessageState(prev => ({ ...prev, ...message }));
  }, []);

  /**
   * Clears the pending message
   */
  const clearPendingMessage = useCallback((): void => {
    setPendingMessageState({
      kind: 'message',
      source: 'customer',
      creationUtc: new Date(),
      serverStatus: 'pending',
      offset: 0,
      correlationId: '',
      data: { message: '' },
      status: null,
    });
  }, []);

  // Clear pending message when triggered
  useEffect(() => {
    if (shouldClearPending) {
      clearPendingMessage();
      setShouldClearPending(false);
    }
  }, [shouldClearPending, clearPendingMessage]);

  /**
   * Adds a pending message with content
   */
  const addPendingMessage = useCallback((content: string): void => {
    setPendingMessage({
      kind: 'message',
      source: 'customer',
      creationUtc: new Date(),
      serverStatus: 'pending',
      offset: Date.now(),
      correlationId: `temp-${Date.now()}`,
      data: { message: content },
      status: null,
    });
  }, [setPendingMessage]);

  /**
   * Processes incoming events and updates messages/status
   */
  const processEvents = useCallback((newEvents: ParlantEvent[]): void => {
    if (!newEvents || newEvents.length === 0) return;

    // Update events
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, ...newEvents];
      return updatedEvents;
    });

    const lastStatusEvent = newEvents.slice().reverse().find((e: ParlantEvent) => e.kind === 'status');

    // Handle status messages
    const lastStatusEventStatus = (lastStatusEvent?.data as StatusEventData)?.status;

    // Create or update status message bubble
    let statusText = '';
    if (lastStatusEventStatus === 'processing') {
      const statusEventData = lastStatusEvent?.data as StatusEventData & { data?: { stage?: string } };
      const stage = statusEventData?.data?.stage;
      if (stage) {
        const stageKey = stage.toLowerCase().replace('...', '');
        const translatedStage = t(`status.${stageKey}`, { defaultValue: `${stage}${stage.endsWith('...') ? '' : '...'}` });
        statusText = translatedStage;
      } else {
        statusText = t('status.thinking');
      }
    } else if (lastStatusEventStatus === 'typing') {
      statusText = t('status.typing');
    }

    if (statusText) {
      setStatusMessage({
        id: 'status-bubble',
        kind: 'message',
        source: 'ai_agent',
        creationUtc: new Date(),
        offset: -1,
        correlationId: 'status',
        data: { message: statusText },
        status: 'typing',
        isStatusMessage: true
      } as MessageInterface & { isStatusMessage: boolean });
    } else {
      setStatusMessage(null);
    }
  }, [t]);

  return {
    messages,
    statusMessage,
    pendingMessage,
    setPendingMessage,
    clearPendingMessage,
    processEvents,
    addPendingMessage
  };
};
