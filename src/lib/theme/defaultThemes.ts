import type { ThemeConfig } from './types';

/**
 * Color Theory Reference:
 * - All colors use HSL format: "hue saturation% lightness%"
 * - Triadic: 3 colors 120° apart on color wheel
 * - Complementary: 2 colors 180° apart
 * - Analogous: Colors adjacent on wheel (30° apart)
 * - Split-complementary: Base + 2 colors adjacent to complement
 */

/**
 * Default theme - Clean slate blue palette
 * Primary: Slate Blue (220°)
 * Uses monochromatic harmony with blue-gray tones
 */
const defaultLightColors = {
  background: '0 0% 99%',
  foreground: '220 14% 10%',
  card: '0 0% 100%',
  'card-foreground': '220 14% 10%',
  popover: '0 0% 100%',
  'popover-foreground': '220 14% 10%',
  primary: '220 70% 50%',
  'primary-foreground': '0 0% 100%',
  secondary: '220 14% 96%',
  'secondary-foreground': '220 14% 10%',
  muted: '220 14% 96%',
  'muted-foreground': '220 10% 46%',
  accent: '220 14% 96%',
  'accent-foreground': '220 14% 10%',
  destructive: '0 72% 51%',
  'destructive-foreground': '0 0% 100%',
  border: '220 13% 91%',
  input: '220 13% 91%',
  ring: '220 70% 50%',
  radius: '0.375rem',
};

const defaultDarkColors = {
  background: '220 20% 7%',
  foreground: '220 10% 98%',
  card: '220 20% 10%',
  'card-foreground': '220 10% 98%',
  popover: '220 20% 10%',
  'popover-foreground': '220 10% 98%',
  primary: '220 70% 60%',
  'primary-foreground': '220 20% 7%',
  secondary: '220 15% 18%',
  'secondary-foreground': '220 10% 98%',
  muted: '220 15% 18%',
  'muted-foreground': '220 10% 65%',
  accent: '220 15% 18%',
  'accent-foreground': '220 10% 98%',
  destructive: '0 62% 45%',
  'destructive-foreground': '0 0% 100%',
  border: '220 15% 18%',
  input: '220 15% 18%',
  ring: '220 70% 60%',
  radius: '0.375rem',
};

export const defaultTheme: ThemeConfig = {
  name: 'default',
  light: defaultLightColors,
  dark: defaultDarkColors,
};

/**
 * Theme presets with carefully selected color harmonies
 */
export const themePresets: Record<string, ThemeConfig> = {
  default: defaultTheme,

  /**
   * Ocean Theme - Teal/Cyan palette
   * Primary: Teal (185°)
   * Triadic accent: Coral (5°)
   * Clean, professional, calming
   */
  ocean: {
    name: 'ocean',
    light: {
      background: '185 20% 98%',
      foreground: '200 25% 10%',
      card: '0 0% 100%',
      'card-foreground': '200 25% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '200 25% 10%',
      primary: '185 75% 40%',         // Rich teal
      'primary-foreground': '0 0% 100%',
      secondary: '185 30% 94%',
      'secondary-foreground': '200 25% 10%',
      muted: '185 20% 95%',
      'muted-foreground': '200 15% 45%',
      accent: '5 70% 55%',            // Coral accent (triadic)
      'accent-foreground': '0 0% 100%',
      destructive: '0 72% 51%',
      'destructive-foreground': '0 0% 100%',
      border: '185 15% 90%',
      input: '185 15% 90%',
      ring: '185 75% 40%',
      radius: '0.375rem',
    },
    dark: {
      background: '200 30% 8%',
      foreground: '185 15% 95%',
      card: '200 25% 12%',
      'card-foreground': '185 15% 95%',
      popover: '200 25% 12%',
      'popover-foreground': '185 15% 95%',
      primary: '185 70% 50%',         // Brighter teal
      'primary-foreground': '200 30% 8%',
      secondary: '200 20% 18%',
      'secondary-foreground': '185 15% 95%',
      muted: '200 20% 16%',
      'muted-foreground': '185 12% 60%',
      accent: '5 65% 55%',            // Coral accent
      'accent-foreground': '0 0% 100%',
      destructive: '0 62% 45%',
      'destructive-foreground': '0 0% 100%',
      border: '200 20% 18%',
      input: '200 20% 18%',
      ring: '185 70% 50%',
      radius: '0.375rem',
    },
  },

  /**
   * Sunset Theme - Warm coral/amber palette
   * Primary: Coral (15°)
   * Secondary: Amber (35°) - analogous
   * Accent: Rose (345°) - split complementary
   * Warm, inviting, energetic
   */
  sunset: {
    name: 'sunset',
    light: {
      background: '30 30% 98%',
      foreground: '20 20% 10%',
      card: '0 0% 100%',
      'card-foreground': '20 20% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '20 20% 10%',
      primary: '15 85% 55%',          // Coral
      'primary-foreground': '0 0% 100%',
      secondary: '35 80% 52%',        // Amber (analogous)
      'secondary-foreground': '0 0% 100%',
      muted: '30 25% 94%',
      'muted-foreground': '20 12% 45%',
      accent: '345 75% 55%',          // Rose (split-complementary)
      'accent-foreground': '0 0% 100%',
      destructive: '0 72% 51%',
      'destructive-foreground': '0 0% 100%',
      border: '30 20% 88%',
      input: '30 20% 88%',
      ring: '15 85% 55%',
      radius: '0.375rem',
    },
    dark: {
      background: '20 25% 6%',
      foreground: '30 20% 95%',
      card: '20 20% 10%',
      'card-foreground': '30 20% 95%',
      popover: '20 20% 10%',
      'popover-foreground': '30 20% 95%',
      primary: '15 80% 58%',          // Brighter coral
      'primary-foreground': '20 25% 6%',
      secondary: '35 75% 55%',        // Brighter amber
      'secondary-foreground': '20 25% 6%',
      muted: '20 18% 15%',
      'muted-foreground': '30 15% 60%',
      accent: '345 70% 58%',          // Brighter rose
      'accent-foreground': '0 0% 100%',
      destructive: '0 62% 45%',
      'destructive-foreground': '0 0% 100%',
      border: '20 18% 18%',
      input: '20 18% 18%',
      ring: '15 80% 58%',
      radius: '0.375rem',
    },
  },

  /**
   * Purple Theme - Rich violet palette
   * Primary: Violet (270°)
   * Accent: Gold (45°) - complementary
   * Elegant, creative, luxurious
   */
  purple: {
    name: 'purple',
    light: {
      background: '270 30% 98%',      // Light lavender bg
      foreground: '270 40% 15%',      // Dark purple text
      card: '0 0% 100%',              // White cards
      'card-foreground': '270 40% 15%',
      popover: '0 0% 100%',
      'popover-foreground': '270 40% 15%',
      primary: '270 65% 50%',         // Vibrant violet
      'primary-foreground': '0 0% 100%',
      secondary: '270 25% 94%',
      'secondary-foreground': '270 40% 15%',
      muted: '270 20% 95%',
      'muted-foreground': '270 15% 45%',
      accent: '45 80% 50%',           // Gold accent (complementary)
      'accent-foreground': '0 0% 100%',
      destructive: '0 72% 51%',
      'destructive-foreground': '0 0% 100%',
      border: '270 20% 90%',
      input: '270 20% 90%',
      ring: '270 65% 50%',
      radius: '0.375rem',
    },
    dark: {
      background: '270 35% 10%',      // Dark purple bg
      foreground: '0 0% 98%',
      card: '270 25% 14%',
      'card-foreground': '0 0% 98%',
      popover: '270 25% 14%',
      'popover-foreground': '0 0% 98%',
      primary: '270 60% 62%',         // Brighter violet
      'primary-foreground': '0 0% 100%',
      secondary: '270 18% 20%',
      'secondary-foreground': '0 0% 98%',
      muted: '270 18% 18%',
      'muted-foreground': '270 12% 65%',
      accent: '45 75% 55%',           // Brighter gold
      'accent-foreground': '270 35% 10%',
      destructive: '0 65% 50%',
      'destructive-foreground': '0 0% 100%',
      border: '270 18% 22%',
      input: '270 18% 22%',
      ring: '270 60% 62%',
      radius: '0.375rem',
    },
  },

  /**
   * Petroleum Theme - Industry-inspired professional colors
   * Primary: Petroleum Blue (#4064a5)
   * Accent: Petroleum Red (#a11238)
   * Professional, trustworthy, industrial
   */
  petroleum: {
    name: 'petroleum',
    light: {
      background: '0 0% 99%',
      foreground: '220 15% 10%',
      card: '0 0% 100%',
      'card-foreground': '220 15% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '220 15% 10%',
      primary: '217 44% 45%',         // Petroleum Blue #4064a5
      'primary-foreground': '0 0% 100%',
      secondary: '220 10% 94%',
      'secondary-foreground': '220 15% 10%',
      muted: '220 10% 96%',
      'muted-foreground': '220 10% 45%',
      accent: '345 82% 35%',          // Petroleum Red #a11238
      'accent-foreground': '0 0% 100%',
      destructive: '345 82% 35%',
      'destructive-foreground': '0 0% 100%',
      border: '220 13% 88%',
      input: '220 13% 88%',
      ring: '217 44% 45%',
      radius: '0.375rem',
    },
    dark: {
      background: '220 25% 8%',
      foreground: '0 0% 98%',
      card: '220 22% 11%',
      'card-foreground': '0 0% 98%',
      popover: '220 22% 11%',
      'popover-foreground': '0 0% 98%',
      primary: '217 50% 55%',         // Lighter Petroleum Blue
      'primary-foreground': '0 0% 100%',
      secondary: '220 18% 18%',
      'secondary-foreground': '0 0% 98%',
      muted: '220 18% 16%',
      'muted-foreground': '220 10% 65%',
      accent: '345 75% 50%',          // Lighter Petroleum Red
      'accent-foreground': '0 0% 100%',
      destructive: '345 75% 50%',
      'destructive-foreground': '0 0% 100%',
      border: '220 18% 20%',
      input: '220 18% 20%',
      ring: '217 50% 55%',
      radius: '0.375rem',
    },
  },
};
