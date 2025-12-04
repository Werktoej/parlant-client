import type { ThemeConfig, CustomerThemeConfig } from './types';
import { defaultTheme, themePresets } from './defaultThemes';
import {
  getStoredThemePreset,
  saveStoredThemePreset,
  getStoredThemeConfig,
  saveStoredThemeConfig,
  getStoredCustomerTheme,
  saveStoredCustomerTheme,
} from './cookieStorage';

/**
 * Default theme preset name
 */
const DEFAULT_THEME_PRESET = 'default';

/**
 * Loads theme configuration from various sources
 * Priority: Customer theme > Theme preset > Environment variables > Stored theme > Default theme
 * @param customerId - Optional customer ID to load customer-specific theme
 * @returns Theme configuration
 */
export function loadTheme(customerId?: string): ThemeConfig {
  // 1. Try to load customer-specific theme from cookie
  if (customerId) {
    const customerTheme = loadCustomerTheme(customerId);
    if (customerTheme) {
      return customerTheme.theme;
    }
  }

  // 2. Try to load theme preset from cookie (defaults to 'default' if not set)
  const presetName = getThemePreset();
  const presetTheme = loadThemePreset(presetName);
  if (presetTheme) {
    return presetTheme;
  }

  // 3. Try to load from environment variables
  const envTheme = loadThemeFromEnv();
  if (envTheme) {
    return envTheme;
  }

  // 4. Try to load from cookie (general theme)
  const storedTheme = loadStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  // 5. Fall back to default theme
  return defaultTheme;
}

/**
 * Loads customer-specific theme from cookie
 * @param customerId - Customer ID
 * @returns Customer theme config or null
 */
export function loadCustomerTheme(customerId: string): CustomerThemeConfig | null {
  return getStoredCustomerTheme<CustomerThemeConfig>(customerId);
}

/**
 * Saves customer-specific theme to cookie
 * @param customerId - Customer ID
 * @param theme - Theme configuration
 */
export function saveCustomerTheme(customerId: string, theme: ThemeConfig): void {
  const config: CustomerThemeConfig = {
    customerId,
    theme,
  };
  saveStoredCustomerTheme(customerId, config);
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
 * Loads theme from cookie
 * @returns Theme config or null
 */
function loadStoredTheme(): ThemeConfig | null {
  return getStoredThemeConfig<ThemeConfig>();
}

/**
 * Saves theme to cookie
 * @param theme - Theme configuration
 */
export function saveTheme(theme: ThemeConfig): void {
  saveStoredThemeConfig(theme);
}

/**
 * Gets the current theme preset name from cookie.
 * Returns 'default' if no preset is stored.
 * @returns Theme preset name (defaults to 'default')
 */
export function getThemePreset(): string {
  const stored = getStoredThemePreset();
  return stored || DEFAULT_THEME_PRESET;
}

/**
 * Saves the theme preset name to cookie
 * @param presetName - Theme preset name
 */
export function saveThemePreset(presetName: string): void {
  saveStoredThemePreset(presetName);
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

