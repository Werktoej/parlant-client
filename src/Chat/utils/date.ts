/**
 * Date utility functions for consistent date handling across the application
 */

import { logWarn } from './logger';

/**
 * Parse a date string robustly handling multiple formats
 * Automatically converts UTC timestamps to local timezone
 * 
 * @param dateString - Date string in various formats (ISO 8601, UTC, etc.)
 * @returns Parsed Date object in user's local timezone
 */
export const parseDate = (dateString: string | undefined): Date => {
  if (!dateString) {
    logWarn('Empty date string provided to parseDate');
    return new Date();
  }

  // Try standard ISO 8601 parsing first (most APIs use this)
  // Format: YYYY-MM-DDTHH:MM:SS.sssZ or YYYY-MM-DDTHH:MM:SS
  // JavaScript Date constructor automatically converts UTC to local time
  let parsedDate = new Date(dateString);

  // Check if the date is valid
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // Try parsing different date formats if ISO failed
  if (dateString.includes('/')) {
    // Handle DD/MM/YYYY HH:MM:SS format
    const parts = dateString.split(' ');
    if (parts.length >= 2) {
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');

      // Create date with YYYY-MM-DD format for consistent parsing
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${(second || '00').padStart(2, '0')}`;
      parsedDate = new Date(isoString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  } else if (dateString.includes('.') && !dateString.includes('T')) {
    // Handle DD.M.YYYY HH.MM.SS format (but not ISO with milliseconds)
    const parts = dateString.split(' ');
    if (parts.length >= 2) {
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split('.');
      const [hour, minute, second] = timePart.split('.');

      // Create date with YYYY-MM-DD format for consistent parsing
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${(second || '00').padStart(2, '0')}`;
      parsedDate = new Date(isoString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }

  // If all parsing failed, log warning and return current date
  logWarn('Failed to parse date string:', dateString);
  return new Date();
};

/**
 * Formats timestamp for display in user's local timezone
 * @param timestamp - Date object or string (UTC will be converted to local)
 * @returns Formatted time string in local timezone
 */
export const formatTimestamp = (timestamp: Date | string): string => {
  const date = timestamp instanceof Date ? timestamp : parseDate(timestamp);

  // toLocaleTimeString automatically shows in user's local timezone
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Use 24-hour format for consistency
  });
};

/**
 * Formats session date for display with relative time
 * @param dateString - Date string
 * @param t - Translation function
 * @returns Formatted date string
 */
export const formatSessionDate = (
  dateString: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
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
 * Gets date from session or title for consistent handling
 * @param session - Session object with potential date fields
 * @returns Date string to use for formatting
 */
export const getSessionDate = (session: {
  title?: string;
  created_at?: string;
  updated_at?: string;
}): string => {
  // Try to get date from session fields first
  let dateToUse = session.updated_at || session.created_at;

  // If no date in session fields, try to extract from title
  if (!dateToUse && session.title && session.title.startsWith('Chat Session ')) {
    const timestampMatch = session.title.match(/Chat Session (.+)/);
    if (timestampMatch) {
      dateToUse = timestampMatch[1];
    }
  }

  return dateToUse || '';
};
