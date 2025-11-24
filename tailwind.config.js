/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Override default Tailwind colors to use CSS variables (makes them configurable)
    colors: {
      // Override blue colors to use primary CSS variables (so bg-blue-500 uses theme)
      blue: {
        50: 'var(--color-primary-50)',
        100: 'var(--color-primary-100)',
        200: 'var(--color-primary-200)',
        300: 'var(--color-primary-300)',
        400: 'var(--color-primary-400)',
        500: 'var(--color-primary-500)',
        600: 'var(--color-primary-600)',
        700: 'var(--color-primary-700)',
        800: 'var(--color-primary-800)',
        900: 'var(--color-primary-900)',
      },
      // Override purple colors to use secondary CSS variables
      purple: {
        50: 'var(--color-secondary-50)',
        100: 'var(--color-secondary-100)',
        200: 'var(--color-secondary-200)',
        300: 'var(--color-secondary-300)',
        400: 'var(--color-secondary-400)',
        500: 'var(--color-secondary-500)',
        600: 'var(--color-secondary-600)',
        700: 'var(--color-secondary-700)',
        800: 'var(--color-secondary-800)',
        900: 'var(--color-secondary-900)',
      },
      // Override green colors to use accent CSS variables (for human agent messages)
      green: {
        50: 'var(--color-accent-50)',
        100: 'var(--color-accent-100)',
        200: 'var(--color-accent-200)',
        300: 'var(--color-accent-300)',
        400: 'var(--color-accent-400)',
        500: 'var(--color-accent-500)',
        600: 'var(--color-accent-600)',
        700: 'var(--color-accent-700)',
        800: 'var(--color-accent-800)',
        900: 'var(--color-accent-900)',
      },
      // Override gray colors to use text/border CSS variables
      gray: {
        50: 'var(--color-background-secondary)',
        100: 'var(--color-border-light)',
        200: 'var(--color-border-default)',
        300: 'var(--color-text-muted)',
        400: 'var(--color-text-tertiary)',
        500: 'var(--color-text-secondary)',
        600: 'var(--color-border-dark)',
        700: '#374151', // Keep some defaults for compatibility
        800: 'var(--color-text-primary)',
        900: '#111827', // Keep some defaults for compatibility
      },
      // Override slate colors for backgrounds
      slate: {
        50: 'var(--color-background-secondary)',
        100: 'var(--color-border-light)',
        200: 'var(--color-border-default)',
        300: 'var(--color-text-tertiary)',
        400: 'var(--color-text-secondary)',
        500: 'var(--color-text-secondary)',
        600: 'var(--color-border-dark)',
        700: '#334155', // Keep some defaults
        800: '#1e293b', // Keep some defaults
        900: 'var(--color-background-dark)',
      },
      // Override red colors to use error CSS variables
      red: {
        50: 'var(--color-error-50)',
        100: 'var(--color-error-100)',
        200: 'var(--color-error-200)',
        300: 'var(--color-error-300)',
        400: 'var(--color-error-400)',
        500: 'var(--color-error-500)',
        600: 'var(--color-error-600)',
        700: 'var(--color-error-700)',
        800: 'var(--color-error-800)',
        900: '#7f1d1d', // Keep some defaults
      },
      // Override indigo colors (used in gradients)
      indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: 'var(--color-secondary-700)', // Map to secondary-700
        800: '#4338ca',
        900: '#312e81',
      },
      // Override pink colors (used in hero gradient)
      pink: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6', // Keep pink-400 for hero gradient
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9f1239',
        900: '#831843',
      },
      // White and black
      white: 'var(--color-background-white)',
      black: '#000000',
      // Keep transparent
      transparent: 'transparent',
      current: 'currentColor',
    },
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-family-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
        '6xl': 'var(--font-size-6xl)',
        '7xl': 'var(--font-size-7xl)',
        '8xl': 'var(--font-size-8xl)',
      },
      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      borderRadius: {
        sm: 'var(--border-radius-sm)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
        xl: 'var(--border-radius-xl)',
        '2xl': 'var(--border-radius-2xl)',
        '3xl': 'var(--border-radius-3xl)',
        full: 'var(--border-radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        none: 'var(--shadow-none)',
      },
    },
  },
  plugins: [],
}
