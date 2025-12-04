import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { loadTheme } from './lib/theme/themeLoader'
import { applyThemeColors, applyThemeMode, getEffectiveThemeMode } from './lib/theme/themeUtils'

// Get customer ID from localStorage if available
const getCustomerId = (): string | undefined => {
  try {
    return localStorage.getItem('parlant_customer_id') || undefined;
  } catch {
    return undefined;
  }
};

// Apply theme immediately before React renders to prevent flash of unstyled content
const applyInitialTheme = (): void => {
  const customerId = getCustomerId();
  const theme = loadTheme(customerId);
  const effectiveMode = getEffectiveThemeMode();
  const colors = effectiveMode === 'dark' ? theme.dark : theme.light;
  applyThemeColors(colors);
  applyThemeMode(effectiveMode);
};

// Apply theme synchronously before React renders
applyInitialTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      errorTitle="Application Error"
      errorMessage="The Virtual Chat application encountered an unexpected error"
    >
      <ThemeProvider customerId={getCustomerId()}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
