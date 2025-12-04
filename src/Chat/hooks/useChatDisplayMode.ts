/**
 * Custom hook for managing chat display mode state
 * Follows ADR-004: Separation of Concerns - State management layer
 */

import { useState, useEffect, useCallback } from 'react';
import { log } from '../utils/logger';

/**
 * Display mode types
 */
export type DisplayMode = 'popup' | 'fullscreen' | 'minimized';

/**
 * Options for useChatDisplayMode hook
 */
interface UseChatDisplayModeOptions {
  /** Initial display mode */
  initialMode?: DisplayMode;
  /** Force minimize flag (external control) */
  forceMinimize?: boolean;
  /** Callback when display mode changes */
  onDisplayModeChange?: (mode: DisplayMode) => void;
  /** Callback when chat is closed */
  onClose?: () => void;
}

/**
 * Return value for useChatDisplayMode hook
 */
interface UseChatDisplayModeReturn {
  /** Current display mode */
  displayMode: DisplayMode;
  /** Whether chat is enabled */
  isChatEnabled: boolean;
  /** Whether chat is minimized */
  isChatMinimized: boolean;
  /** Whether chat is fullscreen */
  isFullScreen: boolean;
  /** Minimize the chat */
  minimizeChat: () => void;
  /** Restore the chat from minimized */
  restoreChat: () => void;
  /** Expand to fullscreen */
  expandToFullscreen: () => void;
  /** Contract from fullscreen */
  contractFromFullscreen: () => void;
}

/**
 * Custom hook for managing chat display mode state
 * 
 * @param options - Display mode configuration options
 * @returns Display mode state and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   displayMode,
 *   isChatMinimized,
 *   minimizeChat,
 *   expandToFullscreen
 * } = useChatDisplayMode({
 *   initialMode: 'popup',
 *   onDisplayModeChange: (mode) => console.log('Mode:', mode)
 * });
 * ```
 */
export const useChatDisplayMode = ({
  initialMode = 'popup',
  forceMinimize = false,
  onDisplayModeChange,
  onClose
}: UseChatDisplayModeOptions): UseChatDisplayModeReturn => {
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(initialMode === 'minimized');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(initialMode === 'fullscreen');

  // Minimize chat when forceMinimize prop is true
  useEffect(() => {
    if (forceMinimize) {
      setIsChatMinimized(true);
      setIsFullScreen(false);
    }
  }, [forceMinimize]);

  /**
   * Minimizes the chat
   */
  const minimizeChat = useCallback(() => {
    setIsChatMinimized(true);
    setIsFullScreen(false);
    onClose?.();
    onDisplayModeChange?.('minimized');
  }, [onClose, onDisplayModeChange]);

  /**
   * Restores the chat from minimized state
   */
  const restoreChat = useCallback(() => {
    setIsChatMinimized(false);
    setIsChatEnabled(true);
    onDisplayModeChange?.('popup');
  }, [onDisplayModeChange]);

  /**
   * Expands to full screen
   */
  const expandToFullscreen = useCallback(() => {
    log('Expanding to fullscreen');
    setIsFullScreen(true);
    onDisplayModeChange?.('fullscreen');
  }, [onDisplayModeChange]);

  /**
   * Contracts from full screen
   */
  const contractFromFullscreen = useCallback(() => {
    log('Contracting to popup');
    setIsFullScreen(false);
    onDisplayModeChange?.('popup');
  }, [onDisplayModeChange]);

  // Compute display mode
  const displayMode: DisplayMode = isFullScreen
    ? 'fullscreen'
    : isChatMinimized
    ? 'minimized'
    : 'popup';

  return {
    displayMode,
    isChatEnabled,
    isChatMinimized,
    isFullScreen,
    minimizeChat,
    restoreChat,
    expandToFullscreen,
    contractFromFullscreen
  };
};

