/**
 * Custom hook for event polling with adaptive intervals
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SessionService } from '../services/SessionService';
import { log, logError } from '../utils/logger';
import type { ParlantEvent } from '../types/parlant';

/**
 * Bot status types
 */
export type BotStatus = 'ready' | 'processing' | 'typing' | 'error';

/**
 * Polling configuration interface
 */
export interface PollingConfig {
  active?: number;    // Fast polling when bot is processing/typing (default: 50ms)
  normal?: number;    // Normal polling (default: 1000ms)
  idle?: number;      // Slow polling when idle (default: 3000ms)
  veryIdle?: number;  // Very slow polling when very idle (default: 5000ms)
  idleThreshold?: number;     // Time before switching to idle polling (default: 10s)
  veryIdleThreshold?: number; // Time before switching to very idle polling (default: 30s)
}

/**
 * Event polling hook options
 */
interface UseEventPollingOptions {
  sessionId: string | null;
  serverUrl: string;
  authToken?: string;
  pollingConfig?: PollingConfig;
  onEventsReceived: (events: ParlantEvent[]) => void;
  onError: (error: string) => void;
}

/**
 * Event polling hook return value
 */
interface UseEventPollingReturn {
  isPolling: boolean;
  lastOffset: number;
  botStatus: BotStatus;
  startPolling: () => void;
  stopPolling: () => void;
  updateBotStatus: (status: BotStatus) => void;
  updateLastUserMessageTime: () => void;
  triggerImmediatePoll: () => void;
}

/**
 * Custom hook for managing event polling with adaptive intervals
 * @param options - Polling configuration and callbacks
 * @returns Polling control functions and state
 */
export const useEventPolling = ({
  sessionId,
  serverUrl,
  authToken,
  pollingConfig,
  onEventsReceived,
  onError
}: UseEventPollingOptions): UseEventPollingReturn => {
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastOffset, setLastOffset] = useState<number>(0);
  const [botStatus, setBotStatus] = useState<BotStatus>('ready');

  const pollingRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false); // Track polling state in ref for closures
  const sessionServiceRef = useRef<SessionService | undefined>(undefined);
  const lastOffsetRef = useRef<number>(0);
  const lastUserMessageTimeRef = useRef<number>(0);
  const lastEventReceivedTimeRef = useRef<number>(0); // Track when we last received events
  const retryCountRef = useRef<number>(0);
  const waitTimeoutRef = useRef<number>(30); // Reduced from 60 to 30 seconds to prevent resource exhaustion
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session service
  if (!sessionServiceRef.current) {
    sessionServiceRef.current = new SessionService(serverUrl, authToken);
  }

  // Polling intervals configuration - memoized to avoid recreation
  const POLLING_INTERVALS = useMemo(() => ({
    ACTIVE: pollingConfig?.active ?? 50,
    NORMAL: pollingConfig?.normal ?? 1000,
    IDLE: pollingConfig?.idle ?? 3000,
    VERY_IDLE: pollingConfig?.veryIdle ?? 5000
  }), [pollingConfig?.active, pollingConfig?.normal, pollingConfig?.idle, pollingConfig?.veryIdle]);

  const IDLE_THRESHOLD = useMemo(() => pollingConfig?.idleThreshold ?? 10000, [pollingConfig?.idleThreshold]);
  const VERY_IDLE_THRESHOLD = useMemo(() => pollingConfig?.veryIdleThreshold ?? 30000, [pollingConfig?.veryIdleThreshold]);

  /**
   * Calculates the appropriate polling interval based on bot status and activity
   */
  const getPollingInterval = useCallback((): number => {
    const now = Date.now();
    const timeSinceLastUserMessage = now - lastUserMessageTimeRef.current;
    const timeSinceLastEvent = now - lastEventReceivedTimeRef.current;

    // Keep polling fast if bot is actively processing/typing
    if (botStatus === 'processing' || botStatus === 'typing') {
      return POLLING_INTERVALS.ACTIVE;
    }

    // Keep polling fast if we recently sent a message OR recently received events
    // This ensures we stay fast while bot is responding
    if (timeSinceLastUserMessage < 5000 || timeSinceLastEvent < 5000) {
      return POLLING_INTERVALS.ACTIVE;
    }

    if (timeSinceLastUserMessage < IDLE_THRESHOLD) {
      return POLLING_INTERVALS.NORMAL;
    }

    if (timeSinceLastUserMessage < VERY_IDLE_THRESHOLD) {
      return POLLING_INTERVALS.IDLE;
    }

    return POLLING_INTERVALS.VERY_IDLE;
  }, [botStatus, POLLING_INTERVALS, IDLE_THRESHOLD, VERY_IDLE_THRESHOLD]);

  /**
   * Main polling function with improved error handling for server timeouts
   */
  const pollEvents = useCallback(async (): Promise<void> => {
    // Don't poll if no session or already polling
    if (!sessionId || pollingRef.current) {
      log(`Poll skipped: sessionId=${sessionId}, pollingRef=${pollingRef.current}`);
      pollingRef.current = false;
      return;
    }

    // Validate session ID format to avoid polling with invalid IDs
    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      log('Poll skipped: invalid session ID');
      pollingRef.current = false;
      return;
    }

    log(`Starting poll: offset=${lastOffsetRef.current}, waitTimeout=${waitTimeoutRef.current}s`);
    pollingRef.current = true;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const events = await sessionServiceRef.current!.fetchEvents(
        sessionId,
        lastOffsetRef.current,
        waitTimeoutRef.current
      );

      if (events && events.length > 0) {
        log(`Received ${events.length} events, max offset: ${Math.max(...events.map((e: ParlantEvent) => e.offset))}`);

        // Update last event received time to keep polling fast while bot is responding
        lastEventReceivedTimeRef.current = Date.now();

        onEventsReceived(events);

        const maxOffset = Math.max(...events.map((e: ParlantEvent) => e.offset));
        const newOffset = maxOffset + 1;
        lastOffsetRef.current = newOffset;
        setLastOffset(newOffset);
      } else {
        log('No new events received');
      }

      // Success - reset retry count and wait timeout
      retryCountRef.current = 0;
      waitTimeoutRef.current = 30;

      const nextInterval = getPollingInterval();
      log(`Next poll in ${nextInterval}ms, isPollingRef=${isPollingRef.current}`);

      // Clear any existing timeout
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }

      pollingTimeoutRef.current = setTimeout(() => {
        pollingRef.current = false;
        log(`Timeout fired: isPollingRef=${isPollingRef.current}, will ${isPollingRef.current ? 'continue' : 'stop'} polling`);
        if (isPollingRef.current) {
          pollEvents();
        }
      }, nextInterval);

    } catch (error) {
      pollingRef.current = false;

      // Check if this is a 504 Gateway Timeout error
      const is504Error = error instanceof Error && error.message.includes('504');
      const isTimeoutError = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('504') ||
        error.message.includes('Request timeout')
      );

      if (is504Error || isTimeoutError) {
        // 504 errors are expected during long-polling - log at info level
        log(`Long-poll timeout (expected behavior, attempt ${retryCountRef.current + 1})`);

        // For 504/timeout errors, implement exponential backoff and reduce wait timeout
        retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
        waitTimeoutRef.current = Math.max(10, 30 - (retryCountRef.current * 5)); // Reduce from 30s to 10s min

        const backoffDelay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 30000); // Cap at 30s
        const retryInterval = Math.max(getPollingInterval(), backoffDelay);

        log(`Retrying in ${retryInterval}ms with ${waitTimeoutRef.current}s timeout`);

        // Clear any existing timeout
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }

        pollingTimeoutRef.current = setTimeout(() => {
          if (isPollingRef.current) {
            pollEvents();
          }
        }, retryInterval);
      } else {
        // For other errors, log as actual error and use normal retry logic
        logError('Error polling events:', error);
        retryCountRef.current = 0;
        waitTimeoutRef.current = 30;

        const retryInterval = Math.max(getPollingInterval(), 5000);

        // Clear any existing timeout
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }

        pollingTimeoutRef.current = setTimeout(() => {
          if (isPollingRef.current) {
            pollEvents();
          }
        }, retryInterval);
      }

      // Only show error to user occasionally for timeout errors to avoid spam
      // For timeout errors, only show on first occurrence to avoid console spam
      if (!isTimeoutError || retryCountRef.current === 1) {
        const errorMessage = `Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`;
        // Don't show error if it's just a timeout - the backoff will handle it
        if (!isTimeoutError) {
          onError(errorMessage);
        }
      }
    }
  }, [sessionId, getPollingInterval, onEventsReceived, onError]);

  /**
   * Starts event polling
   */
  const startPolling = useCallback((): void => {
    if (!sessionId || isPollingRef.current) {
      log(`startPolling skipped: sessionId=${sessionId}, isPollingRef=${isPollingRef.current}`);
      return;
    }

    log('Starting polling for session:', sessionId);
    setIsPolling(true);
    isPollingRef.current = true;
    pollingRef.current = false;
    pollEvents();
  }, [sessionId, pollEvents]);

  /**
   * Stops event polling
   */
  const stopPolling = useCallback((): void => {
    log('Stopping polling');
    setIsPolling(false);
    isPollingRef.current = false;
    pollingRef.current = false;

    // Clear any pending timeouts
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Updates bot status for adaptive polling
   */
  const updateBotStatus = useCallback((status: BotStatus): void => {
    setBotStatus(status);
  }, []);

  /**
   * Updates the last user message time for adaptive polling
   */
  const updateLastUserMessageTime = useCallback((): void => {
    lastUserMessageTimeRef.current = Date.now();
  }, []);

  /**
   * Triggers an immediate poll by canceling the current timeout and starting a new poll
   * Useful when a user sends a message to get immediate feedback
   */
  const triggerImmediatePoll = useCallback((): void => {
    if (!sessionId || !isPollingRef.current) {
      return;
    }

    log('Triggering immediate poll after user action');

    // Cancel current timeout if exists
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Reset polling ref so new poll can start
    pollingRef.current = false;

    // Update last user message time
    lastUserMessageTimeRef.current = Date.now();

    // Trigger immediate poll
    pollEvents();
  }, [sessionId, pollEvents]);

  // Start polling when session changes
  useEffect(() => {
    log(`Polling effect triggered: sessionId=${sessionId}, isPolling=${isPolling}`);
    if (sessionId && !isPolling) {
      log('Triggering startPolling from effect');
      startPolling();
    }

    return () => {
      // Cleanup only on unmount or session change
      log('Polling cleanup triggered');
      isPollingRef.current = false;
      pollingRef.current = false;

      // Clear timeout
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }

      // Abort request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Sync lastOffset ref with state
  useEffect(() => {
    lastOffsetRef.current = lastOffset;
  }, [lastOffset]);

  return {
    isPolling,
    lastOffset,
    botStatus,
    startPolling,
    stopPolling,
    updateBotStatus,
    updateLastUserMessageTime,
    triggerImmediatePoll
  };
};
