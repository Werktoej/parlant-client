/**
 * Cookie storage utility with simple encryption for theme preferences.
 *
 * Uses a simple XOR-based encoding (not cryptographically secure, but obfuscates data)
 * for storing user theme preferences in cookies.
 */

/**
 * Simple XOR key for basic obfuscation (not cryptographically secure)
 */
const OBFUSCATION_KEY = 'parlant-theme-key-2024';

/**
 * Cookie configuration defaults
 */
const COOKIE_DEFAULTS = {
  path: '/',
  sameSite: 'Lax' as const,
  maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
};

/**
 * Simple XOR-based encoding for basic obfuscation.
 * Note: This is NOT cryptographically secure - it's simple obfuscation.
 *
 * @param text - The text to encode
 * @param key - The key to use for XOR operation
 * @returns Base64 encoded obfuscated string
 */
function simpleEncode(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  // Base64 encode to make it URL-safe
  return btoa(result);
}

/**
 * Simple XOR-based decoding.
 *
 * @param encoded - The Base64 encoded obfuscated string
 * @param key - The key to use for XOR operation
 * @returns Decoded original string
 */
function simpleDecode(encoded: string, key: string): string {
  try {
    const decoded = atob(encoded);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Sets a cookie with simple obfuscation.
 *
 * @param name - Cookie name
 * @param value - Value to store (will be obfuscated)
 * @param options - Optional cookie options
 */
export function setEncodedCookie(
  name: string,
  value: string,
  options: Partial<typeof COOKIE_DEFAULTS> = {}
): void {
  if (typeof document === 'undefined') return;

  const encodedValue = simpleEncode(value, OBFUSCATION_KEY);
  const cookieOptions = { ...COOKIE_DEFAULTS, ...options };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(encodedValue)}`;
  cookieString += `; path=${cookieOptions.path}`;
  cookieString += `; max-age=${cookieOptions.maxAge}`;
  cookieString += `; SameSite=${cookieOptions.sameSite}`;

  document.cookie = cookieString;
}

/**
 * Gets a cookie value and decodes it.
 *
 * @param name - Cookie name to retrieve
 * @returns Decoded value or null if not found
 */
export function getEncodedCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const encodedName = encodeURIComponent(name);

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === encodedName && cookieValue) {
      const decodedValue = decodeURIComponent(cookieValue);
      return simpleDecode(decodedValue, OBFUSCATION_KEY);
    }
  }

  return null;
}

/**
 * Removes a cookie.
 *
 * @param name - Cookie name to remove
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0`;
}

/**
 * Theme-specific cookie names
 */
export const THEME_COOKIE_KEYS = {
  PRESET: 'parlant-theme-preset',
  MODE: 'parlant-theme-mode',
  CONFIG: 'parlant-theme-config',
  CUSTOMER_THEME_PREFIX: 'parlant-customer-theme',
} as const;

/**
 * Gets the stored theme preset from cookie.
 *
 * @returns Theme preset name or null
 */
export function getStoredThemePreset(): string | null {
  return getEncodedCookie(THEME_COOKIE_KEYS.PRESET);
}

/**
 * Saves the theme preset to cookie.
 *
 * @param presetName - Theme preset name to save
 */
export function saveStoredThemePreset(presetName: string): void {
  setEncodedCookie(THEME_COOKIE_KEYS.PRESET, presetName);
}

/**
 * Gets the stored theme mode from cookie.
 *
 * @returns Theme mode or null
 */
export function getStoredThemeMode(): 'light' | 'dark' | 'system' | null {
  const mode = getEncodedCookie(THEME_COOKIE_KEYS.MODE);
  if (mode === 'light' || mode === 'dark' || mode === 'system') {
    return mode;
  }
  return null;
}

/**
 * Saves the theme mode to cookie.
 *
 * @param mode - Theme mode to save
 */
export function saveStoredThemeMode(mode: 'light' | 'dark' | 'system'): void {
  setEncodedCookie(THEME_COOKIE_KEYS.MODE, mode);
}

/**
 * Gets stored theme config from cookie.
 *
 * @returns Parsed theme config or null
 */
export function getStoredThemeConfig<T>(): T | null {
  const configStr = getEncodedCookie(THEME_COOKIE_KEYS.CONFIG);
  if (configStr) {
    try {
      return JSON.parse(configStr) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Saves theme config to cookie.
 *
 * @param config - Theme config to save
 */
export function saveStoredThemeConfig<T>(config: T): void {
  setEncodedCookie(THEME_COOKIE_KEYS.CONFIG, JSON.stringify(config));
}

/**
 * Gets stored customer theme from cookie.
 *
 * @param customerId - Customer ID
 * @returns Parsed customer theme config or null
 */
export function getStoredCustomerTheme<T>(customerId: string): T | null {
  const configStr = getEncodedCookie(
    `${THEME_COOKIE_KEYS.CUSTOMER_THEME_PREFIX}-${customerId}`
  );
  if (configStr) {
    try {
      return JSON.parse(configStr) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Saves customer theme to cookie.
 *
 * @param customerId - Customer ID
 * @param config - Customer theme config to save
 */
export function saveStoredCustomerTheme<T>(customerId: string, config: T): void {
  setEncodedCookie(
    `${THEME_COOKIE_KEYS.CUSTOMER_THEME_PREFIX}-${customerId}`,
    JSON.stringify(config)
  );
}

/**
 * Migration key to track if localStorage cleanup has been performed.
 */
const MIGRATION_KEY = 'parlant-theme-migrated-v1';

/**
 * Old localStorage keys that should be cleaned up.
 */
const OLD_LOCALSTORAGE_KEYS = [
  'parlant-theme-preset',
  'parlant-theme-mode',
  'parlant-theme-config',
];

/**
 * Migrates theme settings from localStorage to cookies.
 * This should be called once on app initialization to clean up old localStorage keys.
 * The function checks if migration has already been performed using a migration key.
 */
export function migrateFromLocalStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // Check if migration already performed
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (alreadyMigrated) return;

    // Migrate theme preset
    const oldPreset = localStorage.getItem('parlant-theme-preset');
    if (oldPreset && !getStoredThemePreset()) {
      saveStoredThemePreset(oldPreset);
    }

    // Migrate theme mode
    const oldMode = localStorage.getItem('parlant-theme-mode');
    if (oldMode && !getStoredThemeMode()) {
      if (oldMode === 'light' || oldMode === 'dark' || oldMode === 'system') {
        saveStoredThemeMode(oldMode);
      }
    }

    // Clean up old localStorage keys
    for (const key of OLD_LOCALSTORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (error) {
    console.error('Failed to migrate theme settings:', error);
  }
}

