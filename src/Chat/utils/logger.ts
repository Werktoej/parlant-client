/**
 * Centralized logging utility
 * 
 * This module provides a simple logging interface that can be globally enabled or disabled.
 * All console logging throughout the application should use these functions instead of
 * direct console.log/error/warn/info calls.
 */

/**
 * Global flag to enable or disable all logging
 * Set to false to suppress all console output from the application
 */
let loggingEnabled = false;

/**
 * Configure whether logging is enabled globally
 * 
 * @param enabled - true to enable logging, false to disable
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

/**
 * Check if logging is currently enabled
 * 
 * @returns true if logging is enabled, false otherwise
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

/**
 * Formats current time as HH:MM:SS.mmm
 */
function getTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Log a general message (equivalent to console.log)
 * 
 * @param args - Arguments to log
 */
export function log(...args: unknown[]): void {
  if (loggingEnabled) {
    console.log(`[${getTimestamp()}]`, ...args);
  }
}

/**
 * Log an error message (equivalent to console.error)
 * 
 * @param args - Arguments to log
 */
export function logError(...args: unknown[]): void {
  if (loggingEnabled) {
    console.error(`[${getTimestamp()}]`, ...args);
  }
}

/**
 * Log a warning message (equivalent to console.warn)
 * 
 * @param args - Arguments to log
 */
export function logWarn(...args: unknown[]): void {
  if (loggingEnabled) {
    console.warn(`[${getTimestamp()}]`, ...args);
  }
}

/**
 * Log an info message (equivalent to console.info)
 * 
 * @param args - Arguments to log
 */
export function logInfo(...args: unknown[]): void {
  if (loggingEnabled) {
    console.info(`[${getTimestamp()}]`, ...args);
  }
}

/**
 * Log a debug message (equivalent to console.debug)
 * 
 * @param args - Arguments to log
 */
export function logDebug(...args: unknown[]): void {
  if (loggingEnabled) {
    console.debug(`[${getTimestamp()}]`, ...args);
  }
}

/**
 * Default export object with all logging functions
 */
export const logger = {
  setEnabled: setLoggingEnabled,
  isEnabled: isLoggingEnabled,
  log,
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
};

export default logger;

