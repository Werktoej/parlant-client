import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { getAvailableThemePresets } from '../lib/theme/themeLoader';
import { cn } from '../lib/utils';

/**
 * Props for the ThemeSelector component
 */
interface ThemeSelectorProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as a dropdown or inline buttons */
  variant?: 'dropdown' | 'buttons';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme preset display names
 */
const themeDisplayNames: Record<string, string> = {
  default: 'Default',
  ocean: 'Ocean',
  sunset: 'Sunset',
  purple: 'Purple',
  petroleum: 'Petroleum',
};

/**
 * Theme preset descriptions
 */
const themeDescriptions: Record<string, string> = {
  default: 'Default shadcn theme',
  ocean: 'Calm ocean blue',
  sunset: 'Warm orange to pink',
  purple: 'Elegant violet & gold',
  petroleum: 'Petroleum industry style',
};

/**
 * Theme selector component that allows users to choose between theme presets
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className,
  variant = 'dropdown',
  size = 'md',
}) => {
  const { themePreset, setThemePreset } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const availablePresets = getAvailableThemePresets();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 h-9',
    md: 'text-sm px-4 py-2.5 h-10',
    lg: 'text-base px-5 py-3 h-12',
  };

  const handlePresetSelect = (presetName: string): void => {
    setThemePreset(presetName);
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    // Color preview for button variant
    const themeColors: Record<string, string> = {
      default: 'bg-gradient-to-r from-blue-500 to-blue-600',
      ocean: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      sunset: 'bg-gradient-to-r from-orange-500 to-pink-500',
      purple: 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700',
      petroleum: 'bg-gradient-to-r from-blue-600 to-red-600',
    };
    
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {availablePresets.map((presetName) => {
          const isSelected = themePreset === presetName;
          return (
            <button
              key={presetName}
              onClick={() => handlePresetSelect(presetName)}
              className={cn(
                'inline-flex items-center justify-center rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative overflow-hidden',
                sizeClasses[size],
                isSelected 
                  ? 'border-primary ring-2 ring-primary/30 text-white' 
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              title={themeDescriptions[presetName] || presetName}
            >
              {/* Gradient background when selected */}
              {isSelected && (
                <div className={cn(
                  'absolute inset-0',
                  themeColors[presetName] || 'bg-gradient-to-r from-gray-400 to-gray-500'
                )} />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {/* Always reserve space for the checkmark */}
                <span className={cn('w-3.5 flex-shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}>
                  <Check size={14} />
                </span>
                {themeDisplayNames[presetName] || presetName}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Get button position for dropdown positioning
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl text-foreground hover:bg-card hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          sizeClasses[size]
        )}
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <Palette size={14} className="text-primary" />
        <span className="font-medium">{themeDisplayNames[themePreset] || themePreset}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop with blur - very high z-index to be above everything */}
          <div
            className="fixed inset-0 z-[99998] bg-black/5 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - fixed position, highest z-index */}
          <div 
            className="fixed z-[99999] min-w-[220px] bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
            style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
          >
            <div className="px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Palette size={12} />
                <span>Select Theme</span>
              </div>
            </div>
            <div className="p-1.5">
              {availablePresets.map((presetName) => {
                // Color preview based on theme
                const themeColors: Record<string, string> = {
                  default: 'bg-gradient-to-r from-blue-500 to-blue-600',
                  ocean: 'bg-gradient-to-r from-cyan-500 to-blue-500',
                  sunset: 'bg-gradient-to-r from-orange-500 to-pink-500',
                  purple: 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700',
                  petroleum: 'bg-gradient-to-r from-blue-600 to-red-600',
                };
                
                const isSelected = themePreset === presetName;
                
                return (
                  <button
                    key={presetName}
                    onClick={() => handlePresetSelect(presetName)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-3 group',
                      isSelected ? 'bg-primary/15' : 'hover:bg-muted/50'
                    )}
                  >
                    {/* Color Preview */}
                    <div className={cn(
                      'w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-offset-1 transition-all',
                      themeColors[presetName] || 'bg-gradient-to-r from-gray-400 to-gray-500',
                      isSelected ? 'ring-primary ring-offset-2' : 'ring-transparent group-hover:ring-border'
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-popover-foreground">
                        {themeDisplayNames[presetName] || presetName}
                      </div>
                      <div className="text-xs truncate text-muted-foreground">
                        {themeDescriptions[presetName] || ''}
                      </div>
                    </div>
                    
                    {/* Check indicator */}
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                    )}>
                      {isSelected && <Check size={12} className="text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

