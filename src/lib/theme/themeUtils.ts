import type { ThemeColors } from './types';
import { getStoredThemeMode, saveStoredThemeMode } from './cookieStorage';

/**
 * Converts theme colors to CSS variables
 * @param colors - Theme colors object
 * @param prefix - CSS variable prefix (default: empty for root)
 * @returns Object with CSS variable key-value pairs
 */
export function themeColorsToCSSVariables(
  colors: ThemeColors,
  prefix: string = ''
): Record<string, string> {
  const vars: Record<string, string> = {};
  const varPrefix = prefix ? `${prefix}-` : '';

  Object.entries(colors).forEach(([key, value]) => {
    // Keys are already in kebab-case (e.g., 'card-foreground'), just use them directly
    // Only convert camelCase to kebab-case if needed
    const cssKey = key.includes('-') ? key : key.replace(/([A-Z])/g, '-$1').toLowerCase();
    vars[`--${varPrefix}${cssKey}`] = value;
  });

  return vars;
}

/**
 * Applies theme colors to document root
 * @param colors - Theme colors object
 * @param prefix - CSS variable prefix (default: empty for root)
 */
export function applyThemeColors(colors: ThemeColors, prefix: string = ''): void {
  if (typeof document === 'undefined') return;
  
  const vars = themeColorsToCSSVariables(colors, prefix);
  const root = document.documentElement;

  Object.entries(vars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Gets the current theme mode from cookie or system preference
 * @returns Theme mode ('light', 'dark', or 'system')
 */
export function getThemeMode(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system';

  const stored = getStoredThemeMode();
  return stored || 'system';
}

/**
 * Saves theme mode to cookie
 * @param mode - Theme mode to save
 */
export function saveThemeMode(mode: 'light' | 'dark' | 'system'): void {
  saveStoredThemeMode(mode);
}

/**
 * Gets the effective theme mode (resolves 'system' to 'light' or 'dark')
 * @returns Effective theme mode
 */
export function getEffectiveThemeMode(): 'light' | 'dark' {
  const mode = getThemeMode();
  
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  
  return mode;
}

/**
 * Applies theme mode class to document root
 * @param mode - Theme mode to apply
 */
export function applyThemeMode(mode: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(mode);
}

