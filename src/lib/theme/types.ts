/**
 * Theme configuration types for shadcn/ui based theme system
 */

/**
 * Color palette for a theme
 */
export interface ThemeColors {
  /** Background colors */
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  radius: string;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  /** Theme name/identifier */
  name: string;
  /** Light mode colors */
  light: ThemeColors;
  /** Dark mode colors */
  dark: ThemeColors;
}

/**
 * Customer theme configuration (can be injected)
 */
export interface CustomerThemeConfig {
  /** Customer identifier */
  customerId: string;
  /** Theme configuration */
  theme: ThemeConfig;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

