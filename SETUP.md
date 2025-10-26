# Environment Setup Guide

## Quick Start

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your configuration:**

   ```env
   VITE_SERVER_URL=http://localhost:8800
   VITE_AGENT_ID=your-actual-agent-id
   ```

3. **Start the development server:**
   ```bash
   yarn dev
   ```

## Environment Variables

### Required Variables

- `VITE_SERVER_URL` - The Parlant API server URL
- `VITE_AGENT_ID` - Your agent ID from Parlant

### Optional Variables

- `VITE_AGENT_NAME` - Display name for the agent (default: "Virtual Assistant")
- `VITE_LANGUAGE` - Interface language: 'da' or 'en' (default: 'da')
- `VITE_ENABLE_LOGGING` - Enable console logging (default: false)
- `VITE_INITIAL_MODE` - Start mode: 'minimized', 'popup', or 'fullscreen' (default: 'popup')
- `VITE_AUTO_START_SESSION` - Auto-create session on load (default: true)
- `VITE_SHOW_ATTRIBUTION` - Show "Powered by Parlant" (default: true)

### Polling Configuration (Optional)

Fine-tune the polling intervals in milliseconds:

- `VITE_POLLING_ACTIVE` - Fast polling when bot is active (default: 500)
- `VITE_POLLING_NORMAL` - Normal polling (default: 1000)
- `VITE_POLLING_IDLE` - When idle (default: 3000)
- `VITE_POLLING_VERY_IDLE` - When very idle (default: 5000)
- `VITE_POLLING_IDLE_THRESHOLD` - Time to become idle (default: 10000)
- `VITE_POLLING_VERY_IDLE_THRESHOLD` - Time to become very idle (default: 30000)

## Using Environment Variables in Code

### Recommended: Use the helper function

```typescript
import { getEnvConfig } from "./config/envConfig";

const envConfig = getEnvConfig();

<ParlantChatBot
  serverUrl={envConfig.serverUrl}
  agentId={envConfig.agentId}
  agentName={envConfig.agentName}
  language={envConfig.language}
  // ... other config from envConfig
/>;
```

### Alternative: Direct access

```typescript
<ParlantChatBot
  serverUrl={import.meta.env.VITE_SERVER_URL}
  agentId={import.meta.env.VITE_AGENT_ID}
/>
```

## Important Security Notes

⚠️ **NEVER put sensitive data in `.env` files:**

- ❌ JWT tokens (they come from your auth system at runtime)
- ❌ Customer IDs (they come from the calling component)
- ❌ Customer names (they come from the calling component)
- ❌ API secrets or private keys

✅ **Only put configuration in `.env`:**

- ✅ Server URLs
- ✅ Agent IDs
- ✅ UI preferences (language, mode, etc.)
- ✅ Feature flags

## Multiple Environments

You can create different environment files:

- `.env` - Default configuration
- `.env.local` - Local overrides (not committed)
- `.env.development` - Development environment
- `.env.production` - Production environment

Vite automatically loads the correct file based on the build mode.

## Validation

The application will warn you on startup if required environment variables are missing. Check the browser console for warnings like:

```
Missing required environment variables: VITE_SERVER_URL, VITE_AGENT_ID
Please copy .env.example to .env and configure the required values.
```

## Troubleshooting

### Changes to `.env` not taking effect?

1. Stop the dev server (`Ctrl+C`)
2. Restart it: `yarn dev`
3. Hard refresh the browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)

### Environment variables showing as `undefined`?

- Make sure variable names start with `VITE_`
- Restart the dev server after adding new variables
- Check that the `.env` file is in the project root

### TypeScript errors?

The types are defined in `src/vite-env.d.ts`. If you add new variables, update this file accordingly.
