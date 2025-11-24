import React, { useEffect } from 'react';
import { getThemeConfig, themeToCSSVariables } from '../config/themeConfig';

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  /** Child components */
  children: React.ReactNode;
}

/**
 * ThemeProvider component that injects CSS variables based on theme configuration
 * This component loads theme config and applies CSS variables to the document root
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    // Load theme configuration
    const theme = getThemeConfig();
    
    // Convert theme to CSS variables
    const cssVars = themeToCSSVariables(theme);
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, []);

  return <>{children}</>;
};

