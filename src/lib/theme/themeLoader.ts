import type { ThemeConfig, CustomerThemeConfig } from './types';
import { defaultTheme, themePresets } from './defaultThemes';

/**
 * Theme storage key for localStorage
 */
const THEME_STORAGE_KEY = 'parlant-theme-config';
const CUSTOMER_THEME_STORAGE_KEY = 'parlant-customer-theme';
const THEME_PRESET_KEY = 'parlant-theme-preset';

/**
 * Loads theme configuration from various sources
 * Priority: Customer theme > Theme preset > Environment variables > Stored theme > Default theme
 * @param customerId - Optional customer ID to load customer-specific theme
 * @returns Theme configuration
 */
export function loadTheme(customerId?: string): ThemeConfig {
  // 1. Try to load customer-specific theme from localStorage
  if (customerId) {
    const customerTheme = loadCustomerTheme(customerId);
    if (customerTheme) {
      return customerTheme.theme;
    }
  }

  // 2. Try to load theme preset from localStorage
  const presetName = getThemePreset();
  if (presetName) {
    const presetTheme = loadThemePreset(presetName);
    if (presetTheme) {
      return presetTheme;
    }
  }

  // 3. Try to load from environment variables
  const envTheme = loadThemeFromEnv();
  if (envTheme) {
    return envTheme;
  }

  // 4. Try to load from localStorage (general theme)
  const storedTheme = loadStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  // 5. Fall back to default theme
  return defaultTheme;
}

/**
 * Loads customer-specific theme from localStorage
 * @param customerId - Customer ID
 * @returns Customer theme config or null
 */
export function loadCustomerTheme(customerId: string): CustomerThemeConfig | null {
  try {
    const stored = localStorage.getItem(`${CUSTOMER_THEME_STORAGE_KEY}-${customerId}`);
    if (stored) {
      return JSON.parse(stored) as CustomerThemeConfig;
    }
  } catch (error) {
    console.error('Failed to load customer theme:', error);
  }
  return null;
}

/**
 * Saves customer-specific theme to localStorage
 * @param customerId - Customer ID
 * @param theme - Theme configuration
 */
export function saveCustomerTheme(customerId: string, theme: ThemeConfig): void {
  try {
    const config: CustomerThemeConfig = {
      customerId,
      theme,
    };
    localStorage.setItem(`${CUSTOMER_THEME_STORAGE_KEY}-${customerId}`, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save customer theme:', error);
  }
}

/**
 * Injects a theme for a customer (can be called from external scripts)
 * @param customerId - Customer ID
 * @param theme - Theme configuration
 */
export function injectCustomerTheme(customerId: string, theme: ThemeConfig): void {
  saveCustomerTheme(customerId, theme);
  // Dispatch event to notify theme change
  window.dispatchEvent(new CustomEvent('parlant-theme-injected', { detail: { customerId, theme } }));
}

/**
 * Loads theme from environment variables
 * @returns Theme config or null
 */
function loadThemeFromEnv(): ThemeConfig | null {
  const env = import.meta.env || {};
  const themeName = env.VITE_THEME_NAME;
  
  if (themeName && themePresets[themeName]) {
    return themePresets[themeName];
  }

  // Try to parse custom theme from env
  const customTheme = env.VITE_THEME_CONFIG;
  if (customTheme) {
    try {
      return JSON.parse(customTheme) as ThemeConfig;
    } catch (error) {
      console.error('Failed to parse theme from VITE_THEME_CONFIG:', error);
    }
  }

  return null;
}

/**
 * Loads theme from localStorage
 * @returns Theme config or null
 */
function loadStoredTheme(): ThemeConfig | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ThemeConfig;
    }
  } catch (error) {
    console.error('Failed to load stored theme:', error);
  }
  return null;
}

/**
 * Saves theme to localStorage
 * @param theme - Theme configuration
 */
export function saveTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
}

/**
 * Gets the current theme preset name
 * @returns Theme preset name or null
 */
export function getThemePreset(): string | null {
  try {
    return localStorage.getItem(THEME_PRESET_KEY);
  } catch (error) {
    console.error('Failed to load theme preset:', error);
    return null;
  }
}

/**
 * Saves the theme preset name
 * @param presetName - Theme preset name
 */
export function saveThemePreset(presetName: string): void {
  try {
    localStorage.setItem(THEME_PRESET_KEY, presetName);
  } catch (error) {
    console.error('Failed to save theme preset:', error);
  }
}

/**
 * Loads theme preset by name
 * @param presetName - Theme preset name
 * @returns Theme config or null if preset doesn't exist
 */
export function loadThemePreset(presetName: string): ThemeConfig | null {
  if (themePresets[presetName]) {
    return themePresets[presetName];
  }
  return null;
}

/**
 * Gets all available theme preset names
 * @returns Array of theme preset names
 */
export function getAvailableThemePresets(): string[] {
  return Object.keys(themePresets);
}

/**
 * Exposes theme injection function to window for external use
 */
if (typeof window !== 'undefined') {
  (window as any).parlant = (window as any).parlant || {};
  (window as any).parlant.injectTheme = injectCustomerTheme;
}

