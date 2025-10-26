/**
 * UI constants for consistent behavior across components
 */

/**
 * Responsive breakpoints (matching Tailwind's defaults)
 */
export const BREAKPOINTS = {
  /** Small devices (640px) */
  SM: 640,
  /** Medium devices (768px) */
  MD: 768,
  /** Large devices (1024px) */
  LG: 1024,
  /** Extra large devices (1280px) */
  XL: 1280,
  /** 2X large devices (1536px) */
  XXL: 1536,
} as const;

/**
 * Checks if the current viewport is at or above a breakpoint
 * @param breakpoint - Breakpoint to check
 * @returns True if viewport is at or above the breakpoint
 */
export const isAtBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
};

/**
 * Z-index layers for consistent stacking
 */
export const Z_INDEX = {
  CHAT_POPUP: 50,
  FULLSCREEN: 50,
  MODAL: 60,
  DROPDOWN: 70,
  TOOLTIP: 80,
} as const;

/**
 * Local storage keys used by the application
 */
export const STORAGE_KEYS = {
  SESSIONS_WITH_WELCOME: 'parlant_sessions_with_welcome',
  AUTH_TOKEN: 'parlant_auth_token',
  CUSTOMER_ID: 'parlant_customer_id',
  CUSTOMER_NAME: 'parlant_customer_name',
} as const;

