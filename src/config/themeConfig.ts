/**
 * Theme configuration loaded from environment variables
 * Provides customizable colors, fonts, and styling values
 */

/**
 * Color configuration interface
 */
export interface ColorConfig {
  /** Primary color shades */
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  /** Secondary color shades */
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  /** Accent color shades */
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    white: string;
    dark: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    white: string;
    muted: string;
  };
  /** Border colors */
  border: {
    light: string;
    default: string;
    dark: string;
  };
  /** Error colors */
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
  };
  /** Success colors */
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
  };
}

/**
 * Typography configuration interface
 */
export interface TypographyConfig {
  /** Font family */
  fontFamily: {
    sans: string;
    mono: string;
  };
  /** Font sizes */
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
  };
  /** Font weights */
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

/**
 * Spacing configuration interface
 */
export interface SpacingConfig {
  /** Border radius values */
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  /** Shadow values */
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    none: string;
  };
  /** Opacity values */
  opacity: {
    light: string;
    medium: string;
    heavy: string;
  };
}

/**
 * Complete theme configuration interface
 */
export interface ThemeConfig {
  colors: ColorConfig;
  typography: TypographyConfig;
  spacing: SpacingConfig;
}

/**
 * Parses a color value from environment variables
 * @param value - The color value to parse
 * @param defaultValue - The default color value
 * @returns The parsed color value
 */
const parseColor = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  // Validate hex color format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
    return value;
  }
  // If it's a Tailwind color name, return as-is (will be handled by Tailwind)
  return value;
};

/**
 * Parses a string value from environment variables
 * @param value - The string value to parse
 * @param defaultValue - The default string value
 * @returns The parsed string value
 */
const parseString = (value: string | undefined, defaultValue: string): string => {
  return value || defaultValue;
};

/**
 * Gets default color configuration
 * @returns Default ColorConfig object
 */
const getDefaultColors = (): ColorConfig => {
  return {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    accent: {
      50: '#f0fdf4', // green-50 - for human agent messages
      100: '#dcfce7', // green-100
      200: '#bbf7d0', // green-200
      300: '#86efac', // green-300
      400: '#4ade80', // green-400
      500: '#22c55e', // green-500 - matches original human agent messages
      600: '#16a34a', // green-600 - matches original human agent messages
      700: '#15803d', // green-700
      800: '#166534', // green-800
      900: '#14532d', // green-900
    },
    background: {
      primary: '#0f172a', // slate-900
      secondary: '#f8fafc', // slate-50
      tertiary: '#ffffff',
      white: '#ffffff',
      dark: '#0f172a',
    },
    text: {
      primary: '#1f2937', // gray-800
      secondary: '#6b7280', // gray-500
      tertiary: '#9ca3af', // gray-400
      white: '#ffffff',
      muted: '#d1d5db', // gray-300
    },
    border: {
      light: '#f3f4f6', // gray-100
      default: '#e5e7eb', // gray-200
      dark: '#4b5563', // gray-600
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
  };
};

/**
 * Gets default typography configuration
 * @returns Default TypographyConfig object
 */
const getDefaultTypography = (): TypographyConfig => {
  return {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  };
};

/**
 * Gets default spacing configuration
 * @returns Default SpacingConfig object
 */
const getDefaultSpacing = (): SpacingConfig => {
  return {
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      none: 'none',
    },
    opacity: {
      light: '0.1',
      medium: '0.5',
      heavy: '0.75',
    },
  };
};

/**
 * Loads and validates theme configuration
 * @returns ThemeConfig object with all configuration values
 */
export const getThemeConfig = (): ThemeConfig => {
  const env = import.meta.env || {};
  const defaults = {
    colors: getDefaultColors(),
    typography: getDefaultTypography(),
    spacing: getDefaultSpacing(),
  };

  // Override primary colors if provided
  const primaryColor = parseColor(env.VITE_THEME_PRIMARY_COLOR, '');
  const secondaryColor = parseColor(env.VITE_THEME_SECONDARY_COLOR, '');
  const accentColor = parseColor(env.VITE_THEME_ACCENT_COLOR, '');

  // Override font family if provided
  const fontFamily = parseString(env.VITE_THEME_FONT_FAMILY, defaults.typography.fontFamily.sans);

  // Build theme config with overrides
  const theme: ThemeConfig = {
    colors: {
      ...defaults.colors,
      // Override primary color shades if base color provided
      primary: primaryColor
        ? {
            ...defaults.colors.primary,
            500: primaryColor,
            // Generate lighter/darker shades (simplified - could be enhanced)
            400: primaryColor,
            600: primaryColor,
          }
        : defaults.colors.primary,
      // Override secondary color shades if base color provided
      secondary: secondaryColor
        ? {
            ...defaults.colors.secondary,
            500: secondaryColor,
            400: secondaryColor,
            600: secondaryColor,
          }
        : defaults.colors.secondary,
      // Override accent color shades if base color provided
      accent: accentColor
        ? {
            ...defaults.colors.accent,
            500: accentColor,
            400: accentColor,
            600: accentColor,
          }
        : defaults.colors.accent,
      // Override background colors if provided
      background: {
        primary: parseColor(env.VITE_THEME_BACKGROUND_PRIMARY, defaults.colors.background.primary),
        secondary: parseColor(env.VITE_THEME_BACKGROUND_SECONDARY, defaults.colors.background.secondary),
        tertiary: parseColor(env.VITE_THEME_BACKGROUND_TERTIARY, defaults.colors.background.tertiary),
        white: parseColor(env.VITE_THEME_BACKGROUND_WHITE, defaults.colors.background.white),
        dark: parseColor(env.VITE_THEME_BACKGROUND_DARK, defaults.colors.background.dark),
      },
      // Override text colors if provided
      text: {
        primary: parseColor(env.VITE_THEME_TEXT_PRIMARY, defaults.colors.text.primary),
        secondary: parseColor(env.VITE_THEME_TEXT_SECONDARY, defaults.colors.text.secondary),
        tertiary: parseColor(env.VITE_THEME_TEXT_TERTIARY, defaults.colors.text.tertiary),
        white: parseColor(env.VITE_THEME_TEXT_WHITE, defaults.colors.text.white),
        muted: parseColor(env.VITE_THEME_TEXT_MUTED, defaults.colors.text.muted),
      },
    },
    typography: {
      ...defaults.typography,
      fontFamily: {
        ...defaults.typography.fontFamily,
        sans: fontFamily,
      },
    },
    spacing: {
      ...defaults.spacing,
      borderRadius: {
        ...defaults.spacing.borderRadius,
        lg: parseString(env.VITE_THEME_BORDER_RADIUS_LG, defaults.spacing.borderRadius.lg),
        xl: parseString(env.VITE_THEME_BORDER_RADIUS_XL, defaults.spacing.borderRadius.xl),
        '2xl': parseString(env.VITE_THEME_BORDER_RADIUS_2XL, defaults.spacing.borderRadius['2xl']),
        '3xl': parseString(env.VITE_THEME_BORDER_RADIUS_3XL, defaults.spacing.borderRadius['3xl']),
      },
    },
  };

  return theme;
};

/**
 * Converts theme config to CSS variables object
 * @param theme - Theme configuration object
 * @returns Object with CSS variable key-value pairs
 */
export const themeToCSSVariables = (theme: ThemeConfig): Record<string, string> => {
  const vars: Record<string, string> = {};

  // Color variables
  Object.entries(theme.colors.primary).forEach(([shade, value]) => {
    vars[`--color-primary-${shade}`] = value;
  });
  Object.entries(theme.colors.secondary).forEach(([shade, value]) => {
    vars[`--color-secondary-${shade}`] = value;
  });
  Object.entries(theme.colors.accent).forEach(([shade, value]) => {
    vars[`--color-accent-${shade}`] = value;
  });
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    vars[`--color-background-${key}`] = value;
  });
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    vars[`--color-text-${key}`] = value;
  });
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    vars[`--color-border-${key}`] = value;
  });
  Object.entries(theme.colors.error).forEach(([shade, value]) => {
    vars[`--color-error-${shade}`] = value;
  });
  Object.entries(theme.colors.success).forEach(([shade, value]) => {
    vars[`--color-success-${shade}`] = value;
  });

  // Typography variables
  vars['--font-family-sans'] = theme.typography.fontFamily.sans;
  vars['--font-family-mono'] = theme.typography.fontFamily.mono;
  Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
    vars[`--font-size-${size}`] = value;
  });
  Object.entries(theme.typography.fontWeight).forEach(([weight, value]) => {
    vars[`--font-weight-${weight}`] = value;
  });

  // Spacing variables
  Object.entries(theme.spacing.borderRadius).forEach(([size, value]) => {
    vars[`--border-radius-${size}`] = value;
  });
  Object.entries(theme.spacing.shadow).forEach(([size, value]) => {
    vars[`--shadow-${size}`] = value;
  });
  Object.entries(theme.spacing.opacity).forEach(([key, value]) => {
    vars[`--opacity-${key}`] = value;
  });

  return vars;
};

