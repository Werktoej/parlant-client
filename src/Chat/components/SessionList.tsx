import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Plus, MessageCircle, Calendar, Trash2, Search, RotateCw } from 'lucide-react';
import { useTranslation, type Language } from '../hooks/useTranslation';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { cn } from '../../lib/utils';
import { log, logWarn, logError } from '../utils/logger';

/**
 * Interface for a chat session
 */
interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  agent_id: string;
}

/**
 * Props for the SessionList component
 */
interface SessionListProps {
  /** The URL of the Parlant server */
  serverUrl: string;
  /** Authentication token for backend requests */
  authToken?: string;
  /** Currently selected session ID */
  selectedSessionId?: string | null;
  /** Callback when a session is selected */
  onSessionSelect: (sessionId: string) => void;
  /** Callback when a new session should be created */
  onNewSession: () => void;
  /** Language for the interface */
  language?: Language;
  /** Customer ID for API requests (required for production) */
  customerId: string;
}

/**
 * Ref interface for SessionList imperative methods
 */
export interface SessionListRef {
  /** Refresh the session list */
  refresh: () => void;
}

/**
 * SessionList component that displays and manages chat sessions
 */
export const SessionList = forwardRef<SessionListRef, SessionListProps>(
  function SessionList({
    serverUrl,
    authToken,
    selectedSessionId,
    onSessionSelect,
    onNewSession,
    language = 'en',
    customerId
  }, ref) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const { t } = useTranslation(language);

    /**
     * Fetches sessions from the server
     */
    const fetchSessions = useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        // Build URL with customer_id parameter (always required for production API)
        const url = new URL(`${serverUrl}/sessions`);
        url.searchParams.append('customer_id', customerId);

        log('Fetching sessions from:', url.toString());

        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
        }

        const allSessions = await response.json();
        log('Fetched sessions:', allSessions);
        log('Sessions count:', allSessions?.length || 0);

        // Check if response is an array
        if (!Array.isArray(allSessions)) {
          logError('Sessions response is not an array:', allSessions);
          throw new Error('Invalid sessions response format');
        }

        // No need to filter sessions by customer since all sessions 
        // are already filtered by the bearer token on the server side
        const filteredSessions = allSessions;
        log('Sessions loaded:', filteredSessions.length);

        // Sort by date descending (most recent first)
        filteredSessions.sort((a: Session, b: Session) => {
          // Get date from session fields or extract from title
          let aDateString = a.updated_at || a.created_at;
          let bDateString = b.updated_at || b.created_at;

          // If no date in session fields, try to extract from title
          if (!aDateString && a.title && a.title.startsWith('Chat Session ')) {
            const timestampMatch = a.title.match(/Chat Session (.+)/);
            if (timestampMatch) {
              aDateString = timestampMatch[1];
            }
          }

          if (!bDateString && b.title && b.title.startsWith('Chat Session ')) {
            const timestampMatch = b.title.match(/Chat Session (.+)/);
            if (timestampMatch) {
              bDateString = timestampMatch[1];
            }
          }

          // Parse dates using robust parser
          const aDate = parseDate(aDateString || '').getTime();
          const bDate = parseDate(bDateString || '').getTime();

          // Uncomment for debugging:
          // console.log('Sorting sessions:', {
          //   sessionA: a.id,
          //   sessionB: b.id,
          //   aDateString,
          //   bDateString,
          //   aDate: new Date(aDate),
          //   bDate: new Date(bDate),
          //   result: bDate - aDate
          // });

          // Sort descending (newest first)
          return bDate - aDate;
        });

        log('Sessions ready to display:', filteredSessions.length);
        setSessions(filteredSessions);
      } catch (err) {
        logError('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }, [serverUrl, authToken, customerId]);

    /**
     * Expose refresh method to parent components
     */
    useImperativeHandle(ref, () => ({
      refresh: () => {
        log('SessionList refresh requested');
        fetchSessions();
      }
    }), [fetchSessions]);

    /**
     * Opens the delete confirmation modal
     */
    const openDeleteModal = useCallback((session: Session) => {
      setSessionToDelete(session);
      setDeleteModalOpen(true);
    }, []);

    /**
     * Closes the delete confirmation modal
     */
    const closeDeleteModal = useCallback(() => {
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      setIsDeleting(false);
    }, []);

    /**
     * Deletes a session after confirmation
     */
    const confirmDeleteSession = useCallback(async () => {
      if (!sessionToDelete) return;

      try {
        setIsDeleting(true);

        const deleteHeaders: Record<string, string> = {};
        if (authToken) {
          deleteHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${serverUrl}/sessions/${sessionToDelete.id}`, {
          method: 'DELETE',
          headers: deleteHeaders
        });

        if (!response.ok) {
          throw new Error(`Failed to delete session: ${response.status}`);
        }

        // Remove from local state
        setSessions(prev => prev.filter(session => session.id !== sessionToDelete.id));

        // If deleted session was selected, clear selection
        if (selectedSessionId === sessionToDelete.id) {
          onNewSession();
        }

        // Close modal
        closeDeleteModal();
      } catch (err) {
        logError('Error deleting session:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete session');
        setIsDeleting(false);
      }
    }, [sessionToDelete, serverUrl, authToken, selectedSessionId, onNewSession, closeDeleteModal]);

    /**
     * Parse a date string robustly handling multiple formats
     */
    const parseDate = (dateString: string): Date => {
      if (!dateString) return new Date(0);

      // Try parsing different date formats
      if (dateString.includes('/')) {
        // Handle DD/MM/YYYY HH:MM:SS format
        const parts = dateString.split(' ');
        if (parts.length >= 2) {
          const [datePart, timePart] = parts;
          const [day, month, year] = datePart.split('/');
          const [hour, minute, second] = timePart.split(':');

          // Create date with YYYY-MM-DD format for consistent parsing
          const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${(second || '00').padStart(2, '0')}`;
          return new Date(isoString);
        }
      } else if (dateString.includes('.')) {
        // Handle DD.M.YYYY HH.MM.SS format
        const parts = dateString.split(' ');
        if (parts.length >= 2) {
          const [datePart, timePart] = parts;
          const [day, month, year] = datePart.split('.');
          const [hour, minute, second] = timePart.split('.');

          // Create date with YYYY-MM-DD format for consistent parsing
          const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${(second || '00').padStart(2, '0')}`;
          return new Date(isoString);
        }
      }

      // Try standard parsing
      return new Date(dateString);
    };

    /**
     * Formats the session date for display
     */
    const formatSessionDate = (dateString: string): string => {
      if (!dateString) {
        return 'Unknown date';
      }

      const date = parseDate(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        logWarn('Invalid date string:', dateString);
        return 'Invalid date';
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Format time with seconds: HH:MM:SS
      const timeWithSeconds = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      if (sessionDate.getTime() === today.getTime()) {
        // Today: "Today HH:MM:SS"
        return t('time.todayAt', { time: timeWithSeconds });
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        // Yesterday: "Yesterday HH:MM:SS"
        return t('time.yesterdayAt', { time: timeWithSeconds });
      } else {
        // Older: "DD/MM/YYYY HH:MM:SS"
        const dateStr = date.toLocaleDateString();
        return `${dateStr} ${timeWithSeconds}`;
      }
    };

    /**
     * Gets a preview title for the session
     */
    const getSessionTitle = (session: Session): string => {
      // Check if title contains an ISO timestamp and extract it
      if (session.title && session.title.startsWith('Chat Session ')) {
        const timestampMatch = session.title.match(/Chat Session (.+)/);
        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          // Try to parse the timestamp from the title
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return `${t('session.defaultTitle')} ${formatSessionDate(timestamp)}`;
          }
        }
      }

      // Use session.title if it's a custom title
      if (session.title && !session.title.startsWith('Chat Session ')) {
        return session.title;
      }

      // Fall back to using created_at or updated_at
      const dateToUse = session.created_at || session.updated_at;
      if (dateToUse) {
        return `${t('session.defaultTitle')} ${formatSessionDate(dateToUse)}`;
      }

      return t('session.defaultTitle');
    };

    /**
     * Filters sessions based on search term
     */
    const filteredSessions = sessions.filter(session =>
      getSessionTitle(session).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fetch sessions on component mount
    useEffect(() => {
      fetchSessions();
    }, [fetchSessions]);

    return (
      <div className="w-full h-full bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">{t('sessions.title')}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  fetchSessions().finally(() => setIsRefreshing(false));
                }}
                className="bg-muted hover:bg-muted text-muted-foreground p-2 rounded-lg transition-colors"
                title={t('sessions.refresh')}
                disabled={isRefreshing}
              >
                <RotateCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onNewSession}
                className="bg-primary hover:bg-primary text-primary-foreground p-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                title={t('sessions.newChat')}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('sessions.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">{t('sessions.loading')}</div>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-destructive text-destructive-foreground border border-destructive rounded-lg p-3">
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchSessions}
                  className="mt-2 text-sm underline hover:text-primary"
                >
                  {t('sessions.retry')}
                </button>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageCircle size={32} className="mb-2 text-muted-foreground" />
              <p className="text-sm">
                {searchTerm ? t('sessions.noResults') : t('sessions.noSessions')}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 select-none border',
                    selectedSessionId === session.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'hover:bg-muted border-border'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSessionSelect(session.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-card-foreground truncate">
                        {getSessionTitle(session)}
                      </h3>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Calendar size={12} className="mr-1" />
                        <span>{(() => {
                          // Try to get date from session fields first
                          let dateToFormat = session.updated_at || session.created_at;

                          // If no date in session fields, try to extract from title
                          if (!dateToFormat && session.title && session.title.startsWith('Chat Session ')) {
                            const timestampMatch = session.title.match(/Chat Session (.+)/);
                            if (timestampMatch) {
                              dateToFormat = timestampMatch[1];
                            }
                          }

                          return formatSessionDate(dateToFormat || '');
                        })()}</span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(session);
                      }}
                      className="invisible group-hover:visible p-1 text-muted-foreground hover:text-destructive transition-all"
                      title={t('sessions.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          sessionTitle={sessionToDelete ? getSessionTitle(sessionToDelete) : ''}
          onConfirm={confirmDeleteSession}
          onCancel={closeDeleteModal}
          language={language}
          isDeleting={isDeleting}
        />
      </div>
    );
  });

SessionList.displayName = 'SessionList';
