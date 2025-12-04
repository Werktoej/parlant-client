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
  /** Button variant colors for message actions */
  'btn-success': string;
  'btn-success-foreground': string;
  'btn-danger': string;
  'btn-danger-foreground': string;
  'btn-warning': string;
  'btn-warning-foreground': string;
  'btn-info': string;
  'btn-info-foreground': string;
  'btn-neutral': string;
  'btn-neutral-foreground': string;
}

/**
 * Button variant types for message content
 */
export type ButtonVariant = 
  | 'default'
  | 'primary'
  | 'success' | 'accept' | 'yes'
  | 'danger' | 'reject' | 'no'
  | 'warning' | 'maybe'
  | 'info'
  | 'neutral';

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

