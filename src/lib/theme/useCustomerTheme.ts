import { useEffect } from 'react';
import { loadTheme } from './themeLoader';
import { injectCustomerTheme } from './themeLoader';

/**
 * Hook to update theme when customerId changes
 * This hook should be used in components that have access to customerId
 * It injects the customer theme which will be picked up by ThemeProvider
 * @param customerId - Current customer ID
 */
export function useCustomerTheme(customerId?: string): void {
  useEffect(() => {
    if (!customerId) return;

    // Load customer theme and inject it
    // This will trigger ThemeProvider to update via the event system
    const loadedTheme = loadTheme(customerId);
    injectCustomerTheme(customerId, loadedTheme);
  }, [customerId]);
}

