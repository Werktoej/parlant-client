# Parlant ChatBot Component

A complete, self-contained React chatbot component for integrating Parlant AI chat functionality into your applications.

## Features

- 🔐 **Multi-Provider JWT Authentication** - Works with Microsoft AD, Keycloak, Auth0, Okta, Google OAuth, WordPress, and more
- 💬 **Rich Message Content** - Supports markdown links and styled action buttons
- 🎨 **Button Variants** - Themed buttons for accept/reject, yes/no, and other actions
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🎯 **Theme System** - Full theme customization with presets (default, ocean, sunset, purple, petroleum)
- 🔄 **Session Management** - Automatic session creation and persistence
- 🌍 **Multi-language Support** - Danish and English built-in
- ⚡ **Adaptive Polling** - Smart polling intervals based on activity
- 🎯 **TypeScript** - Fully typed for great developer experience

## Quick Start

### Step 1: Setup Environment

```bash
cp .env.example .env
# Edit .env and add your VITE_SERVER_URL and VITE_AGENT_ID
```

### Step 2: Import and Use

```tsx
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function App({ authToken }: { authToken: string }) {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="microsoft"
    />
  );
}
```

## Rich Message Content

The chatbot supports rendering rich content in messages using markdown-like syntax. This allows Parlant to return messages with clickable links and styled action buttons.

### Links

Standard markdown links are rendered as clickable links that open in a new tab:

```markdown
Check out [our documentation](https://docs.example.com) for more info.
Visit [this page](https://example.com/page) to learn more.
```

### Buttons

Custom button syntax creates styled, clickable buttons:

```markdown
[btn:Click Me](https://example.com)
[btn:Get Started](https://signup.example.com)
```

### Button Variants

Buttons support variants for different action types. Use the syntax `[btn:Label:variant](url)`:

| Variant | Aliases | Color | Use Case |
|---------|---------|-------|----------|
| `success` | `accept`, `yes` | Green | Confirmations, approvals |
| `danger` | `reject`, `no` | Red | Declines, cancellations |
| `warning` | `maybe` | Amber | Uncertain, defer actions |
| `info` | - | Blue | Informational actions |
| `neutral` | - | Gray | Skip, dismiss actions |
| `primary` | - | Theme primary | Primary actions |
| `default` | - | Theme accent | Standard buttons |

**Example message from Parlant:**

```markdown
Would you like to proceed with the booking?

[btn:Yes, Book It:success](action:confirm) [btn:No Thanks:danger](action:cancel) [btn:Maybe Later:neutral](action:defer)
```

### Handling Button Clicks

You can handle button clicks with a custom callback:

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  onButtonClick={(url, label, variant) => {
    console.log(`Button clicked: ${label} (${variant}) -> ${url}`);
    // Handle the action based on url/label/variant
  }}
/>
```

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `serverUrl` | `string` | The URL of the Parlant API server |
| `agentId` | `string` | The ID of the agent to chat with |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentName` | `string` | `'My Agent'` | Display name for the agent |
| `authToken` | `string` | - | JWT token for authentication |
| `authProvider` | `'microsoft' \| 'keycloak' \| 'auth0' \| 'okta' \| 'google' \| 'wordpress' \| 'generic'` | `'generic'` | Auth provider for JWT claim mapping |
| `customerId` | `string` | `'guest'` | Customer ID (only used when no authToken) |
| `customerName` | `string` | - | Customer name for personalization |
| `language` | `'da' \| 'en'` | `'da'` | Interface language |
| `initialMode` | `'popup' \| 'fullscreen' \| 'minimized'` | `'popup'` | Initial display mode |
| `pollingConfig` | `PollingConfig` | - | Custom polling intervals |
| `onSessionCreated` | `(sessionId: string) => void` | - | Callback when session is created |
| `onClose` | `() => void` | - | Callback when chat is closed |
| `onButtonClick` | `(url: string, label: string, variant?: ButtonVariant) => void` | - | Callback for message button clicks |
| `autoStartSession` | `boolean` | `true` | Auto-create session on mount |
| `showAttribution` | `boolean` | `true` | Show "Powered by Parlant" |
| `enableLogging` | `boolean` | `false` | Enable console logging |

### PollingConfig

```typescript
interface PollingConfig {
  active?: number;    // Fast polling when bot is active (default: 500ms)
  normal?: number;    // Normal polling (default: 1000ms)
  idle?: number;      // Slow polling when idle (default: 3000ms)
  veryIdle?: number;  // Very slow polling (default: 5000ms)
  idleThreshold?: number;     // Time before idle (default: 10000ms)
  veryIdleThreshold?: number; // Time before very idle (default: 30000ms)
}
```

## Theme Customization

### Theme Presets

The chatbot includes several built-in theme presets:

- **default** - Clean slate blue palette
- **ocean** - Teal/cyan palette with coral accents
- **sunset** - Warm coral/amber palette
- **purple** - Rich violet with gold accents
- **petroleum** - Professional blue/red industrial palette

Set via environment variable:

```env
VITE_THEME_NAME=petroleum
```

Or programmatically:

```typescript
import { themePresets } from '@/lib/theme/defaultThemes';
import { injectCustomerTheme } from '@/lib/theme/themeLoader';

injectCustomerTheme('customer-id', themePresets.petroleum);
```

### Button Variant Colors

Each theme includes customizable button variant colors:

| Variable | Description |
|----------|-------------|
| `--btn-success` / `--btn-success-foreground` | Success/accept buttons (green) |
| `--btn-danger` / `--btn-danger-foreground` | Danger/reject buttons (red) |
| `--btn-warning` / `--btn-warning-foreground` | Warning/maybe buttons (amber) |
| `--btn-info` / `--btn-info-foreground` | Info buttons (blue) |
| `--btn-neutral` / `--btn-neutral-foreground` | Neutral buttons (gray) |

### Custom Theme

Create a custom theme with your own colors:

```typescript
import type { ThemeConfig } from '@/lib/theme/types';

const customTheme: ThemeConfig = {
  name: 'my-theme',
  light: {
    background: '0 0% 99%',
    foreground: '220 14% 10%',
    primary: '220 70% 50%',
    'primary-foreground': '0 0% 100%',
    // ... other color variables
    'btn-success': '142 71% 45%',
    'btn-success-foreground': '0 0% 100%',
    'btn-danger': '0 72% 51%',
    'btn-danger-foreground': '0 0% 100%',
    // ... other button variants
  },
  dark: {
    // ... dark mode colors
  },
};
```

## Environment Variables

### Required

```env
VITE_SERVER_URL=http://localhost:8800
VITE_AGENT_ID=your-agent-id-here
```

### Optional

```env
VITE_AGENT_NAME=Virtual Assistant
VITE_LANGUAGE=da
VITE_ENABLE_LOGGING=false
VITE_INITIAL_MODE=popup
VITE_AUTO_START_SESSION=true
VITE_SHOW_ATTRIBUTION=true
VITE_THEME_NAME=default

# Polling Configuration (milliseconds)
VITE_POLLING_ACTIVE=500
VITE_POLLING_NORMAL=1000
VITE_POLLING_IDLE=3000
VITE_POLLING_VERY_IDLE=5000
```

### Using Environment Config

```tsx
import { getEnvConfig } from "./config/envConfig";

const envConfig = getEnvConfig();

<ParlantChatBot
  serverUrl={envConfig.serverUrl}
  agentId={envConfig.agentId}
  agentName={envConfig.agentName}
  language={envConfig.language}
  pollingConfig={envConfig.pollingConfig}
/>
```

## Authentication

The chatbot supports JWT authentication with automatic claim extraction for major providers.

### Basic Setup

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  authToken={jwtToken}
  authProvider="microsoft" // or 'keycloak', 'auth0', etc.
/>
```

### Supported Providers

| Provider | Key | Claims Mapped |
|----------|-----|---------------|
| Microsoft Azure AD | `microsoft` | `oid`, `name`, `preferred_username` |
| Keycloak | `keycloak` | `sub`, `preferred_username`, `name` |
| Auth0 | `auth0` | `sub`, `name`, `nickname` |
| Okta | `okta` | `sub`, `uid`, `name` |
| Google OAuth | `google` | `sub`, `email`, `name` |
| WordPress | `wordpress` | `data.user.id`, `user_display_name` |
| Generic OIDC | `generic` | Standard OIDC claims |

For detailed authentication integration, see [AUTH_INTEGRATION.md](./AUTH_INTEGRATION.md).

## Display Modes

### Popup Mode (Default)

Floating window in the bottom-right corner, can be minimized or expanded.

### Fullscreen Mode

Takes over the entire screen with session list sidebar.

```tsx
<ParlantChatBot initialMode="fullscreen" />
```

### Minimized Mode

Starts as a floating button, click to expand.

```tsx
<ParlantChatBot initialMode="minimized" />
```

## Error Handling

The application includes React Error Boundaries to prevent white screens and provide recovery options.

```tsx
import { ChatErrorBoundary } from "./components/ErrorBoundary";

<ChatErrorBoundary>
  <ParlantChatBot serverUrl="..." agentId="..." />
</ChatErrorBoundary>
```

For detailed error handling documentation, see [ERROR_HANDLING.md](./ERROR_HANDLING.md).

## TypeScript Support

Import types for better development experience:

```tsx
import { 
  ParlantChatBot, 
  ParlantChatBotProps, 
  PollingConfig,
  ButtonVariant 
} from "./Chat";

const config: ParlantChatBotProps = {
  serverUrl: "https://api.example.com",
  agentId: "agent-123",
  language: "da",
};
```

## Installation

### Copy Files

```
src/Chat/
  ├── components/
  │   ├── ParlantChatBot.tsx
  │   ├── ChatWindow.tsx
  │   ├── ChatInterface.tsx
  │   ├── MessageBubble.tsx
  │   ├── MessageContent.tsx    # Rich content renderer
  │   └── ...
  ├── hooks/
  ├── services/
  ├── utils/
  ├── types/
  └── index.ts
```

### Install Dependencies

```bash
yarn add @tanstack/react-query parlant-client lucide-react
yarn add -D @types/react @types/react-dom
```

## Troubleshooting

### Messages not rendering links/buttons

- Ensure messages use correct markdown syntax: `[text](url)` for links, `[btn:Label](url)` for buttons
- Check that MessageContent component is being used (default in MessageBubble)

### Theme not applying

- Verify environment variable `VITE_THEME_NAME` is set correctly
- Restart dev server after changing `.env` files
- Check browser console for theme loading errors

### JWT authentication issues

- Enable `enableLogging={true}` to see JWT validation warnings
- Verify token is not expired
- Check that `authProvider` matches your identity provider

### Polling issues

- Adjust `pollingConfig` based on your needs
- Monitor network traffic in browser DevTools

## License

MIT
