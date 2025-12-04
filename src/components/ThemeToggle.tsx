import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

/**
 * Props for the ThemeToggle component
 */
interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme toggle button component
 * Allows users to switch between light and dark modes
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, size = 'md' }) => {
  const { effectiveMode, toggleMode } = useTheme();

  const sizeClasses = {
    sm: 'h-9 w-9',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 22,
  };

  return (
    <button
      onClick={toggleMode}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl text-foreground hover:bg-card hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${effectiveMode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {effectiveMode === 'dark' ? (
        <Sun size={iconSizes[size]} className="text-amber-500" />
      ) : (
        <Moon size={iconSizes[size]} className="text-primary" />
      )}
    </button>
  );
};

