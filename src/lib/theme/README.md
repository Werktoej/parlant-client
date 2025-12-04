# Theme System Documentation

This theme system provides a shadcn/ui-based theming solution with support for:
- Light and dark modes
- Customer-specific theme injection
- Dynamic theme switching
- Beautiful gradient themes
- Theme selector with visual previews

## Basic Usage

### Using Theme in Components

```typescript
import { useTheme } from '@/components/ThemeProvider';

function MyComponent() {
  const { theme, mode, effectiveMode, setMode, toggleMode } = useTheme();
  
  return (
    <div className="bg-background text-foreground">
      <p>Current mode: {effectiveMode}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
    </div>
  );
}
```

### Theme Toggle Component

```typescript
import { ThemeToggle } from '@/components';

function App() {
  return (
    <div>
      <ThemeToggle />
    </div>
  );
}
```

## Customer Theme Injection

### Injecting a Theme via JavaScript

Customers can inject custom themes using the global `parlant` object:

```javascript
window.parlant.injectTheme('customer-123', {
  name: 'custom-theme',
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    'primary-foreground': '210 40% 98%',
    // ... other colors
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    'primary-foreground': '222.2 47.4% 11.2%',
    // ... other colors
  }
});
```

### Theme Color Format

All colors use HSL format without the `hsl()` wrapper:
- `background: '0 0% 100%'` (white)
- `primary: '221.2 83.2% 53.3%'` (blue)

### Available Theme Properties

- `background` - Main background color
- `foreground` - Main text color
- `card` - Card background
- `card-foreground` - Card text color
- `popover` - Popover background
- `popover-foreground` - Popover text color
- `primary` - Primary brand color
- `primary-foreground` - Text on primary
- `secondary` - Secondary color
- `secondary-foreground` - Text on secondary
- `muted` - Muted background
- `muted-foreground` - Muted text
- `accent` - Accent color
- `accent-foreground` - Text on accent
- `destructive` - Error/destructive color
- `destructive-foreground` - Text on destructive
- `border` - Border color
- `input` - Input border color
- `ring` - Focus ring color
- `radius` - Border radius (e.g., '0.5rem')

## Using Theme Colors in Tailwind

The theme colors are automatically available as Tailwind classes:

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
  <div className="border border-border">
    Bordered content
  </div>
</div>
```

## Environment Variables

You can set a default theme via environment variables:

```env
VITE_THEME_NAME=blue  # Uses a preset theme
# OR
VITE_THEME_CONFIG='{"name":"custom",...}'  # Full theme JSON
```

## Theme Presets

Available preset themes:
- `default` - Default shadcn theme
- `ocean` - Calm ocean blue with gradients
- `sunset` - Warm orange to pink gradient theme
- `forest` - Natural green theme
- `royal` - Elegant purple theme
- `purple` - Beautiful dark purple gradient theme
- `star` - STAR theme (Danish government style with blue and red accents)

