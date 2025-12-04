# Petroleum Theme Usage Guide

## Overview

The `petroleum` theme is a preset theme inspired by industry professional design, featuring:
- **Blue** (#4064a5) as the primary color
- **Red/Maroon** (#a11238) as accent/destructive color
- **Grey** for borders and muted elements
- Clean, professional industrial aesthetic

## Using the Petroleum Theme

### Via Environment Variable

Set the theme name in your `.env` file:

```env
VITE_THEME_NAME=petroleum
```

### Via Theme Injection

```javascript
// Load the petroleum theme preset
import { themePresets } from '@/lib/theme/defaultThemes';

// Inject for a specific customer
window.parlant.injectTheme('customer-123', themePresets.petroleum);
```

### Programmatically

```typescript
import { themePresets } from '@/lib/theme/defaultThemes';
import { injectCustomerTheme } from '@/lib/theme/themeLoader';

// Apply petroleum theme
injectCustomerTheme('customer-id', themePresets.petroleum);
```

## Color Palette

### Light Mode
- **Primary**: Blue (`217 45% 45%` / #4064a5) - Used for headers, main buttons
- **Secondary**: Grey (`0 0% 50%` / #808080) - Used for secondary elements
- **Accent**: Red/Maroon (`345 80% 35%` / #a11238) - Used for accents
- **Destructive**: Red/Maroon (`345 80% 35%` / #a11238) - Used for errors, important actions
- **Background**: White (`0 0% 100%` / #ffffff)
- **Foreground**: Black (`0 0% 0%` / #000000)
- **Borders**: Light grey (`0 0% 85%` / #d9d9d9)

### Dark Mode
- **Primary**: Lighter blue (`217 45% 55%`) - Better contrast in dark mode
- **Background**: Dark blue-grey (`217 45% 8%`)
- **Foreground**: Light (`0 0% 98%`)
- **Accent**: Lighter red (`345 70% 50%`) - Better visibility

## Example Usage

```tsx
import { useTheme } from '@/components/ThemeProvider';

function PetroleumBrandedComponent() {
  const { theme } = useTheme();
  
  return (
    <div className="bg-background text-foreground">
      {/* Header with petroleum blue */}
      <header className="bg-primary text-primary-foreground p-4">
        <h1>Petroleum Application</h1>
      </header>
      
      {/* Content with blue accents */}
      <main className="bg-card p-6">
        <a href="#" className="text-secondary hover:text-secondary/80">
          Learn more
        </a>
        
        {/* Destructive action */}
        <button className="bg-destructive text-destructive-foreground">
          Delete
        </button>
      </main>
    </div>
  );
}
```

## Visual Characteristics

The Petroleum theme provides:
- **Professional appearance** suitable for industrial/enterprise applications
- **High contrast** for accessibility
- **Consistent branding** with industrial design language
- **Clear visual hierarchy** with blue headers and red accents

## Theme Comparison

| Feature | Default | Petroleum Theme |
|---------|---------|-----------------|
| Primary Color | Blue (#3b82f6) | Blue (#4064a5) |
| Secondary Color | Gray | Grey (#808080) |
| Accent Color | Gray | Red/Maroon (#a11238) |
| Destructive | Red | Red/Maroon (#a11238) |
| Background | White | White |
| Text | Dark gray | Black |
| Style | Modern | Industrial/Professional |

