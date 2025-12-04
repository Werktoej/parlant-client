import React, { useEffect, useState, useCallback } from 'react';
import type { ThemeConfig, ThemeMode } from '../lib/theme/types';
import { loadTheme, getThemePreset, saveThemePreset, loadThemePreset } from '../lib/theme/themeLoader';
import { migrateFromLocalStorage } from '../lib/theme/cookieStorage';
import {
  applyThemeColors,
  applyThemeMode,
  getThemeMode,
  getEffectiveThemeMode,
  saveThemeMode,
} from '../lib/theme/themeUtils';

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Optional customer ID for customer-specific themes */
  customerId?: string;
  /** Optional initial theme mode */
  initialMode?: ThemeMode;
}

/**
 * Context for theme management
 */
interface ThemeContextValue {
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Current theme mode */
  mode: ThemeMode;
  /** Effective theme mode (resolved from system preference) */
  effectiveMode: 'light' | 'dark';
  /** Current theme preset name (defaults to 'default') */
  themePreset: string;
  /** Function to set theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Function to toggle between light and dark */
  toggleMode: () => void;
  /** Function to set theme preset */
  setThemePreset: (presetName: string) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook to access theme context
 * @returns Theme context value
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * ThemeProvider component that manages theme configuration and dark mode
 * Supports customer-specific themes and light/dark mode switching
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  customerId,
  initialMode,
}) => {
  // Migrate from localStorage to cookies on first run
  // This must happen before any state initialization
  if (typeof window !== 'undefined') {
    migrateFromLocalStorage();
  }

  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const loadedTheme = loadTheme(customerId);
    // Apply theme immediately on initialization
    const effective = getEffectiveThemeMode();
    const colors = effective === 'dark' ? loadedTheme.dark : loadedTheme.light;
    applyThemeColors(colors);
    applyThemeMode(effective);
    return loadedTheme;
  });
  const [mode, setModeState] = useState<ThemeMode>(() => initialMode || getThemeMode());
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(() =>
    getEffectiveThemeMode()
  );
  const [themePreset, setThemePresetState] = useState<string>(() => getThemePreset());

  /**
   * Applies theme colors based on current mode
   */
  const applyTheme = useCallback(
    (themeConfig: ThemeConfig, currentMode: 'light' | 'dark') => {
      const colors = currentMode === 'dark' ? themeConfig.dark : themeConfig.light;
      applyThemeColors(colors);
      applyThemeMode(currentMode);
    },
    []
  );

  /**
   * Updates theme mode and applies it
   */
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      saveThemeMode(newMode);
      const effective = newMode === 'system' ? getEffectiveThemeMode() : newMode;
      setEffectiveMode(effective);
      applyTheme(theme, effective);
    },
    [theme, applyTheme]
  );

  /**
   * Toggles between light and dark mode
   */
  const toggleMode = useCallback(() => {
    const currentEffective = getEffectiveThemeMode();
    const newMode: ThemeMode = currentEffective === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  }, [setMode]);

  /**
   * Sets the theme preset
   */
  const setThemePreset = useCallback(
    (presetName: string) => {
      const presetTheme = loadThemePreset(presetName);
      if (presetTheme) {
        saveThemePreset(presetName);
        setThemePresetState(presetName);
        setTheme(presetTheme);
        const effective = getEffectiveThemeMode();
        setEffectiveMode(effective);
        applyTheme(presetTheme, effective);
      }
    },
    [applyTheme]
  );

  /**
   * Handles system theme preference changes
   */
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const effective = getEffectiveThemeMode();
      setEffectiveMode(effective);
      applyTheme(theme, effective);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, theme, applyTheme]);

  /**
   * Handles theme injection events
   */
  useEffect(() => {
    const handleThemeInjected = (event: CustomEvent) => {
      const { customerId: injectedCustomerId, theme: injectedTheme } = event.detail;
      // Update theme if:
      // 1. The injected customerId matches the current customerId, OR
      // 2. There's no current customerId set (global theme injection)
      const currentCustomerId = customerId || localStorage.getItem('parlant_customer_id');
      if (!customerId || injectedCustomerId === currentCustomerId) {
        setTheme(injectedTheme);
        applyTheme(injectedTheme, effectiveMode);
      }
    };

    window.addEventListener('parlant-theme-injected', handleThemeInjected as EventListener);
    return () => {
      window.removeEventListener('parlant-theme-injected', handleThemeInjected as EventListener);
    };
  }, [customerId, effectiveMode, applyTheme]);

  /**
   * Loads and applies theme on mount and when customerId changes
   */
  useEffect(() => {
    const loadedTheme = loadTheme(customerId);
    setTheme(loadedTheme);
    const effective = getEffectiveThemeMode();
    setEffectiveMode(effective);

    // Update themePreset state to match the loaded theme
    const currentPreset = getThemePreset();
    if (loadThemePreset(currentPreset)?.name === loadedTheme.name) {
      setThemePresetState(currentPreset);
    }

    applyTheme(loadedTheme, effective);
  }, [customerId, applyTheme]);

  /**
   * Listens for customerId changes in localStorage
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'parlant_customer_id' && e.newValue) {
        const newCustomerId = e.newValue;
        if (newCustomerId !== customerId) {
          const loadedTheme = loadTheme(newCustomerId);
          setTheme(loadedTheme);
          const effective = getEffectiveThemeMode();
          setEffectiveMode(effective);
          applyTheme(loadedTheme, effective);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [customerId, applyTheme]);

  /**
   * Applies theme when mode or theme changes
   */
  useEffect(() => {
    applyTheme(theme, effectiveMode);
  }, [theme, effectiveMode, applyTheme]);

  const contextValue: ThemeContextValue = {
    theme,
    mode,
    effectiveMode,
    themePreset,
    setMode,
    toggleMode,
    setThemePreset,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
