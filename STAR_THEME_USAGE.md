# STAR Theme Usage Guide

## Overview

The `star` theme is a preset theme inspired by the Danish government website (star.dk) design, featuring:
- **Blue** (#4064a5) as the primary color (matching STAR campaign boxes)
- **Red/Maroon** (#a11238) as accent/destructive color (matching STAR campaign boxes)
- **Grey** for borders and muted elements
- Clean, professional government aesthetic

## Using the STAR Theme

### Via Environment Variable

Set the theme name in your `.env` file:

```env
VITE_THEME_NAME=star
```

### Via Theme Injection

```javascript
// Load the star theme preset
import { themePresets } from '@/lib/theme/defaultThemes';

// Inject for a specific customer
window.parlant.injectTheme('customer-123', themePresets.star);
```

### Programmatically

```typescript
import { themePresets } from '@/lib/theme/defaultThemes';
import { injectCustomerTheme } from '@/lib/theme/themeLoader';

// Apply star theme
injectCustomerTheme('customer-id', themePresets.star);
```

## Color Palette

### Light Mode
- **Primary**: Blue (`217 45% 45%` / #4064a5) - Used for headers, main buttons, campaign boxes
- **Secondary**: Grey (`0 0% 50%` / #808080) - Used for secondary elements
- **Accent**: Red/Maroon (`345 80% 35%` / #a11238) - Used for accents and campaign boxes
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

function STARBrandedComponent() {
  const { theme } = useTheme();
  
  return (
    <div className="bg-background text-foreground">
      {/* Header with STAR purple */}
      <header className="bg-primary text-primary-foreground p-4">
        <h1>STAR Application</h1>
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

The STAR theme provides:
- **Professional appearance** suitable for government/public sector applications
- **High contrast** for accessibility
- **Consistent branding** with Danish government design language
- **Clear visual hierarchy** with purple headers and blue accents

## Theme Comparison

| Feature | Default | STAR Theme |
|---------|---------|------------|
| Primary Color | Blue (#3b82f6) | Blue (#4064a5) |
| Secondary Color | Gray | Grey (#808080) |
| Accent Color | Gray | Red/Maroon (#a11238) |
| Destructive | Red | Red/Maroon (#a11238) |
| Background | White | White |
| Text | Dark gray | Black |
| Style | Modern | Government/Professional |

