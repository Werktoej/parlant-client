# Parlant ChatBot Component

A complete, self-contained React chatbot component for integrating Parlant AI chat functionality into your applications.

## Features

- 🔐 **Multi-Provider JWT Authentication** - Works with Microsoft AD, Keycloak, Auth0, Okta, Google OAuth, WordPress, and more
- 🎯 **Automatic Claim Mapping** - Intelligent extraction of customer info from different JWT token formats
- 💬 **Multiple Display Modes** - Popup, fullscreen, and minimized states
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🎨 **Customizable** - Configurable polling, language, and styling
- 🔄 **Session Management** - Automatic session creation and persistence
- 🌍 **Multi-language Support** - Danish and English built-in
- ⚡ **Adaptive Polling** - Smart polling intervals based on activity
- 🎯 **TypeScript** - Fully typed for great developer experience
- 📝 **Console Logging Control** - Enable/disable all logging via single parameter
- ⚙️ **Environment Configuration** - Easy deployment with Vite environment variables

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
    <div>
      {/* Your app content */}

      <ParlantChatBot
        serverUrl={envConfig.serverUrl}
        agentId={envConfig.agentId}
        authToken={authToken} // JWT token from your auth system
        authProvider="microsoft" // or 'keycloak', 'auth0', etc.
      />
    </div>
  );
}
```

**That's it!** The chatbot will appear in the bottom-right corner with automatic customer identification from your JWT token. 🎉

## Installation

### Copy Files

Copy the entire Chat folder to your project:

```
client/src/Chat/
  ├── components/
  │   ├── ParlantChatBot.tsx
  │   ├── ChatWindow.tsx
  │   ├── ChatInterface.tsx
  │   ├── FullScreenChatbot.tsx
  │   ├── SessionList.tsx
  │   ├── WelcomeMessage.tsx
  │   ├── DeleteConfirmModal.tsx
  │   └── ParlantChatBot.example.tsx
  ├── hooks/
  ├── services/
  ├── utils/
  ├── types/
  ├── constants/
  ├── i18n/
  └── index.ts
```

**Optional:** Copy `ConfigurationModal.tsx` if you want to use the example configuration UI:

```
client/src/components/ConfigurationModal.tsx
```

### Install Dependencies

```bash
yarn add @tanstack/react-query parlant-client lucide-react
yarn add -D @types/react @types/react-dom
```

### Configure Tailwind CSS

```js
// tailwind.config.js
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Props API

### Required Props

| Prop        | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `serverUrl` | `string` | The URL of the Parlant API server |
| `agentId`   | `string` | The ID of the agent to chat with  |

### Optional Props

| Prop               | Type                                                                                     | Default     | Description                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `agentName`        | `string`                                                                                 | `'My Agent'` | Display name for the agent                                                                |
| `authToken`        | `string`                                                                                 | -           | JWT token for authentication (recommended). Customer info will be extracted automatically |
| `authProvider`     | `'microsoft' \| 'keycloak' \| 'auth0' \| 'okta' \| 'google' \| 'wordpress' \| 'generic'` | `'generic'` | Auth provider type for automatic JWT claim mapping                                        |
| `customerId`       | `string`                                                                                 | `'guest'`   | Customer ID (only used when no authToken provided)                                        |
| `customerName`     | `string`                                                                                 | -           | Customer name for personalization (overrides JWT-derived value)                           |
| `language`         | `'da' \| 'en'`                                                                           | `'da'`      | Interface language                                                                        |
| `initialMode`      | `'popup' \| 'fullscreen' \| 'minimized'`                                                 | `'popup'`   | Initial display mode                                                                      |
| `pollingConfig`    | `PollingConfig`                                                                          | -           | Custom polling intervals (see below)                                                      |
| `onSessionCreated` | `(sessionId: string) => void`                                                            | -           | Callback when a session is created                                                        |
| `onClose`          | `() => void`                                                                             | -           | Callback when chat is closed/minimized                                                    |
| `autoStartSession` | `boolean`                                                                                | `true`      | Whether to automatically create a session on mount                                        |
| `showAttribution`  | `boolean`                                                                                | `true`      | Whether to show "Powered by Parlant" attribution                                          |
| `enableLogging`    | `boolean`                                                                                | `false`     | Whether to enable console logging throughout the application                              |

### PollingConfig

Configure how frequently the component polls for new messages:

```typescript
interface PollingConfig {
  active?: number; // Fast polling when bot is processing/typing (default: 500ms)
  normal?: number; // Normal polling (default: 1000ms)
  idle?: number; // Slow polling when idle (default: 3000ms)
  veryIdle?: number; // Very slow polling when very idle (default: 5000ms)
  idleThreshold?: number; // Time before switching to idle (default: 10000ms)
  veryIdleThreshold?: number; // Time before switching to very idle (default: 30000ms)
}
```

## Common Use Cases

### With Microsoft Azure AD (Recommended)

```tsx
import { useMsal } from "@azure/msal-react";
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function App() {
  const envConfig = getEnvConfig();
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (accounts.length > 0) {
      instance
        .acquireTokenSilent({
          scopes: ["User.Read"],
          account: accounts[0],
        })
        .then((response) => setAccessToken(response.accessToken));
    }
  }, [instance, accounts]);

  if (!accessToken) return <div>Authenticating...</div>;

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={accessToken}
      authProvider="microsoft" // Automatic Azure AD claim mapping
    />
  );
}
```

### With Keycloak

```tsx
import { useKeycloak } from "@react-keycloak/web";
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function App() {
  const envConfig = getEnvConfig();
  const { keycloak } = useKeycloak();

  if (!keycloak.authenticated || !keycloak.token) {
    return <div>Please log in</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={keycloak.token}
      authProvider="keycloak" // Automatic Keycloak claim mapping
    />
  );
}
```

### Full-Screen Mode (for dedicated chat pages)

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  initialMode="fullscreen"
/>
```

### With Callbacks and Logging

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  enableLogging={true}
  onSessionCreated={(sessionId) => {
    console.log("Chat started:", sessionId);
  }}
  onClose={() => {
    console.log("Chat closed");
  }}
/>
```

### With Custom Polling Configuration

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  pollingConfig={{
    active: 500,
    normal: 1000,
    idle: 3000,
    veryIdle: 5000,
    idleThreshold: 10000,
    veryIdleThreshold: 30000,
  }}
/>
```

## Integration Patterns

### Pattern 1: Simple Integration (No Auth)

Perfect for public-facing support chat:

```tsx
function PublicSupportPage() {
  return (
    <div className="container">
      <h1>Need Help?</h1>
      <p>Chat with our support team</p>

      <ParlantChatBot
        serverUrl={process.env.REACT_APP_PARLANT_URL}
        agentId={process.env.REACT_APP_AGENT_ID}
        agentName="Support Team"
        language="en"
      />
    </div>
  );
}
```

### Pattern 2: With User Authentication

Extract customer info from your auth system:

```tsx
import { useAuth } from "./hooks/useAuth";
import { ParlantChatBot } from "./Chat";

function AuthenticatedApp() {
  const { user } = useAuth();

  return (
    <div>
      <YourApp />

      {user && (
        <ParlantChatBot
          serverUrl={process.env.REACT_APP_PARLANT_URL}
          agentId={process.env.REACT_APP_AGENT_ID}
          authToken={user.jwtToken}
          language="da"
        />
      )}
    </div>
  );
}
```

### Pattern 3: Fullscreen Chat Page

Create a dedicated chat page:

```tsx
// pages/ChatPage.tsx
import { ParlantChatBot } from "./Chat";

function ChatPage() {
  return (
    <div className="h-screen w-screen">
      <ParlantChatBot
        serverUrl={process.env.REACT_APP_PARLANT_URL}
        agentId={process.env.REACT_APP_AGENT_ID}
        initialMode="fullscreen"
        language="da"
      />
    </div>
  );
}

export default ChatPage;
```

### Pattern 4: Conditional Based on Page

Only show chat on certain pages:

```tsx
import { useLocation } from "react-router-dom";
import { ParlantChatBot } from "./Chat";

function App() {
  const location = useLocation();

  // Only show chat on support and pricing pages
  const showChat = ["/support", "/pricing", "/contact"].includes(
    location.pathname
  );

  return (
    <div>
      <YourApp />

      {showChat && (
        <ParlantChatBot
          serverUrl={process.env.REACT_APP_PARLANT_URL}
          agentId={process.env.REACT_APP_AGENT_ID}
          language="da"
        />
      )}
    </div>
  );
}
```

### Pattern 5: With Analytics Tracking

Track chat usage in your analytics:

```tsx
import { ParlantChatBot } from "./Chat";
import { analytics } from "./services/analytics";

function App() {
  const handleSessionCreated = (sessionId: string) => {
    analytics.track("chat_started", {
      sessionId,
      timestamp: new Date(),
      page: window.location.pathname,
    });
  };

  const handleChatClose = () => {
    analytics.track("chat_closed", {
      timestamp: new Date(),
    });
  };

  return (
    <div>
      <YourApp />

      <ParlantChatBot
        serverUrl={process.env.REACT_APP_PARLANT_URL}
        agentId={process.env.REACT_APP_AGENT_ID}
        onSessionCreated={handleSessionCreated}
        onClose={handleChatClose}
        language="da"
      />
    </div>
  );
}
```

## Authentication & Security

### JWT Token Authentication

The component supports JWT (JSON Web Token) authentication with identity providers like **Microsoft Azure AD**, **Keycloak**, **Auth0**, **Okta**, **Google OAuth**, and others.

**NEW:** Built-in Token Adapter automatically maps claims from different auth providers! Simply specify your `authProvider` and the chatbot handles the rest.

#### JWT Token Format

The component expects JWT tokens with the following claims:

```json
{
  "sub": "user-unique-id", // REQUIRED - Used as customerId
  "name": "John Doe", // OPTIONAL - Used as customerName
  "exp": 1234567890, // REQUIRED - Token expiration timestamp
  "iat": 1234567890, // OPTIONAL - Issued at timestamp
  "iss": "https://your-idp.com", // Validated by backend
  "aud": "your-app-id" // Validated by backend
}
```

**Required Claims:**

- `sub` (Subject): Unique user identifier - used as `customerId`
- `exp` (Expiration): Token expiration timestamp - validated client and server-side

**Optional Claims:**

- `name`: User's full name - used as `customerName`
- `preferred_username`: Username (often email)
- `email`: User's email address
- Additional custom claims from your identity provider

#### How the Chatbot Uses JWT Tokens

The component will automatically:

1. Parse the JWT token
2. Extract `sub` as `customerId`
3. Extract `name` as `customerName`
4. Send token in `Authorization: Bearer {token}` header to all backend requests
5. Validate token expiration client-side (with warnings)
6. Backend validates token signature, expiration, and audience

**Backend Security (Parlant API):**
The backend performs critical security validations:

- ✅ Validates JWT signature using public keys from your identity provider
- ✅ Verifies token expiration (`exp` claim)
- ✅ Checks token audience (`aud` claim) matches your application
- ✅ Validates issuer (`iss` claim) is from trusted identity provider

### Token Adapter - Universal Auth Provider Support

The chatbot includes a powerful **Token Adapter** that automatically maps JWT claims from different authentication providers to the chatbot's internal requirements. No more manual claim mapping!

#### Supported Auth Providers

The Token Adapter comes with built-in support for:

| Provider               | Key         | Typical Claims Used                                           |
| ---------------------- | ----------- | ------------------------------------------------------------- |
| **Microsoft Azure AD** | `microsoft` | `oid`, `sub`, `name`, `preferred_username`                    |
| **Keycloak**           | `keycloak`  | `sub`, `preferred_username`, `name`                           |
| **Auth0**              | `auth0`     | `sub`, `user_id`, `name`, `nickname`                          |
| **Okta**               | `okta`      | `sub`, `uid`, `name`, `preferred_username`                    |
| **Google OAuth**       | `google`    | `sub`, `email`, `name`, `given_name`                          |
| **WordPress JWT**      | `wordpress` | `data.user.id` (nested), `user_display_name`, `user_nicename` |
| **Generic OIDC**       | `generic`   | Standard OpenID Connect claims                                |

#### How to Use the Token Adapter

Simply specify the `authProvider` prop when creating the chatbot:

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  authToken={microsoftADToken}
  authProvider="microsoft" // 🎉 Automatically maps Azure AD claims!
/>
```

The Token Adapter will:

1. Parse the JWT token
2. Look for customer ID in provider-specific claim names (e.g., `oid` for Microsoft, `sub` for others)
3. Look for customer name in provider-specific claim names
4. Map them to the chatbot's internal structure
5. Log warnings if required claims are missing (when `enableLogging={true}`)

#### Custom Auth Provider

For custom SSO systems or auth providers not in the built-in list, create a custom adapter:

```tsx
import { createCustomAdapter } from "./Chat/utils/tokenAdapter";

const customAdapter = createCustomAdapter({
  name: "My Custom SSO",
  customerIdClaims: ["userId", "employeeId", "sub"], // Try these in order
  customerNameClaims: ["fullName", "displayName", "name"],
});

const customerInfo = customAdapter.extractCustomerInfo(jwtToken);

<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  authToken={jwtToken}
  customerId={customerInfo?.customerId}
  customerName={customerInfo?.customerName}
/>;
```

#### Advanced: Custom Extractor Function

For complex scenarios with custom logic:

```tsx
import { createCustomAdapter } from "./Chat/utils/tokenAdapter";

const adapter = createCustomAdapter({
  name: "Complex Auth",
  customerIdClaims: ["sub"], // Fallback
  customerNameClaims: ["name"],
  customExtractor: (payload) => {
    // Custom logic - e.g., combining fields
    const firstName = payload.first_name || payload.given_name;
    const lastName = payload.last_name || payload.family_name;

    return {
      customerId: payload.employee_id || payload.sub,
      customerName:
        firstName && lastName ? `${firstName} ${lastName}` : undefined,
    };
  },
});
```

#### Nested Claims Support

The Token Adapter supports nested JSON paths using dot notation:

```tsx
const adapter = createCustomAdapter({
  name: "Nested Claims",
  customerIdClaims: ["user.id", "user.userId"], // Supports "user.id" path
  customerNameClaims: ["user.profile.name", "user.name"],
});
```

### Integration with Microsoft Azure AD

When integrating with Microsoft Azure AD (Active Directory):

```tsx
import { useMsal } from "@azure/msal-react";
import { ParlantChatBot } from "./Chat";

function App() {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      // Request access token
      instance
        .acquireTokenSilent({
          scopes: ["User.Read"],
          account: accounts[0],
        })
        .then((response) => {
          setAccessToken(response.accessToken);
        });
    }
  }, [accounts, instance]);

  return (
    <div>
      {accessToken && (
        <ParlantChatBot
          serverUrl="http://localhost:8800"
          agentId="your-agent-id"
          authToken={accessToken}
          authProvider="microsoft" // 🎉 Automatic Azure AD claim mapping
          enableLogging={true}
        />
      )}
    </div>
  );
}
```

**Azure AD Token Claims (automatically mapped):**

- `oid`: User's unique object ID → mapped to `customerId`
- `name`: User's display name → mapped to `customerName`
- `preferred_username`: User's email (fallback for `customerId`)
- `exp`: Token expiration
- `tid`: Tenant ID

### Integration with Keycloak

When integrating with Keycloak:

```tsx
import { useKeycloak } from "@react-keycloak/web";
import { ParlantChatBot } from "./Chat";

function App() {
  const { keycloak } = useKeycloak();

  return (
    <div>
      {keycloak.authenticated && (
        <ParlantChatBot
          serverUrl="http://localhost:8800"
          agentId="your-agent-id"
          authToken={keycloak.token}
          authProvider="keycloak" // 🎉 Automatic Keycloak claim mapping
          enableLogging={true}
        />
      )}
    </div>
  );
}
```

**Keycloak Token Claims (automatically mapped):**

- `sub`: User's unique identifier → mapped to `customerId`
- `name`: User's display name → mapped to `customerName`
- `preferred_username`: Username (fallback for both ID and name)
- `email`: User's email (fallback for `customerId`)
- `exp`: Token expiration

### Integration with WordPress

When integrating with WordPress using the JWT Authentication for WP REST API plugin:

```tsx
import { ParlantChatBot } from "./Chat";

function App() {
  const [wpToken, setWpToken] = useState<string | null>(null);

  useEffect(() => {
    // Login to WordPress
    fetch("https://your-wordpress-site.com/wp-json/jwt-auth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "your-username",
        password: "your-password",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          setWpToken(data.token);
          // WordPress also returns: user_display_name, user_email, user_nicename
        }
      });
  }, []);

  return (
    <div>
      {wpToken && (
        <ParlantChatBot
          serverUrl="http://localhost:8800"
          agentId="your-agent-id"
          authToken={wpToken}
          authProvider="wordpress" // 🎉 Automatic WordPress claim mapping
          enableLogging={true}
        />
      )}
    </div>
  );
}
```

**WordPress Token Structure:**
WordPress JWT tokens have a unique nested structure:

```json
{
  "iss": "https://your-wordpress-site.com",
  "iat": 1438571050,
  "nbf": 1438571050,
  "exp": 1439175850,
  "data": {
    "user": {
      "id": "1"
    }
  }
}
```

**WordPress Token Claims (automatically mapped):**

- `data.user.id`: User's unique ID (nested structure) → mapped to `customerId`
- `user_display_name`: User's display name → mapped to `customerName`
- `user_nicename`: User's nicename (fallback for `customerName`)
- `user_email`: User's email (returned in login response)
- `exp`: Token expiration

**WordPress Plugin Required:**
[JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) by Tmeister

### Token Refresh Strategy

**Important:** The chatbot component does **NOT** handle token refresh. Token refresh is the responsibility of your parent application.

**Why?** Token refresh requires refresh tokens and specific grant flows that should be managed by your authentication library (MSAL, Keycloak adapter, etc.).

**Recommended approach:**

1. **Parent app handles token refresh:**

   ```tsx
   function App() {
     const { token, refreshToken } = useAuth(); // Your auth hook

     // Automatically refresh token when it expires
     useEffect(() => {
       const interval = setInterval(() => {
         refreshToken();
       }, 50 * 60 * 1000); // Refresh every 50 minutes

       return () => clearInterval(interval);
     }, [refreshToken]);

     return (
       <ParlantChatBot
         authToken={token}
         // ... other props
       />
     );
   }
   ```

2. **Handle auth failures gracefully:**
   - When the backend returns 401 (Unauthorized), redirect user to login
   - The chatbot will display user-friendly error messages for auth failures
   - Users should re-authenticate through your app's login flow

### Security Best Practices

✅ **DO:**

- Always use HTTPS in production
- Store tokens securely (httpOnly cookies preferred, localStorage acceptable with HTTPS)
- Validate tokens on both client and server
- Use short-lived access tokens (15-60 minutes)
- Implement token refresh in your parent application
- Enable `enableLogging={true}` during development to catch auth issues early

❌ **DON'T:**

- Never expose JWT tokens in URLs or query parameters
- Don't store sensitive data in JWT tokens
- Don't trust client-side validation alone (backend must validate)
- Never commit JWT tokens to version control
- Don't use tokens after they expire

### Token Validation During Development

Enable logging to get helpful warnings about token issues:

```tsx
<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  authToken={yourToken}
  enableLogging={true} // Shows token validation warnings
/>
```

The component will log warnings for:

- ⚠️ Expired tokens
- ⚠️ Missing required claims (`sub`)
- ⚠️ Malformed tokens
- ✅ Successful token validation

## Display Modes

### Popup Mode (Default)

- Appears as a floating window in the bottom-right corner
- Can be minimized to a button
- Can be expanded to fullscreen
- Perfect for embedded support chat

### Fullscreen Mode

- Takes over the entire screen
- Shows session list sidebar on desktop
- Includes mobile-optimized navigation
- Great for dedicated chat pages

### Minimized Mode

- Starts as a floating button
- Click to expand to popup or fullscreen
- Useful for non-intrusive chat availability

## Environment Variables

This project uses Vite environment variables for configuration. This is the **recommended approach** for production deployments.

### Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and configure your values:

```env
# Parlant Configuration (REQUIRED)
VITE_SERVER_URL=http://localhost:8800
VITE_AGENT_ID=your-agent-id-here

# Optional Configuration
VITE_AGENT_NAME=Virtual Assistant
VITE_LANGUAGE=da
VITE_ENABLE_LOGGING=false
VITE_INITIAL_MODE=popup
VITE_AUTO_START_SESSION=true
VITE_SHOW_ATTRIBUTION=true

# Optional: Polling Configuration (in milliseconds)
# VITE_POLLING_ACTIVE=500
# VITE_POLLING_NORMAL=1000
# VITE_POLLING_IDLE=3000
# VITE_POLLING_VERY_IDLE=5000
# VITE_POLLING_IDLE_THRESHOLD=10000
# VITE_POLLING_VERY_IDLE_THRESHOLD=30000
```

### Using Environment Variables

**Recommended:** Use the `getEnvConfig()` helper function:

```tsx
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function App() {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      language={envConfig.language}
      initialMode={envConfig.initialMode}
      autoStartSession={envConfig.autoStartSession}
      enableLogging={envConfig.enableLogging}
      showAttribution={envConfig.showAttribution}
      pollingConfig={envConfig.pollingConfig}
    />
  );
}
```

**Alternative:** Access environment variables directly:

```tsx
<ParlantChatBot
  serverUrl={import.meta.env.VITE_SERVER_URL}
  agentId={import.meta.env.VITE_AGENT_ID}
  agentName={import.meta.env.VITE_AGENT_NAME}
  language={import.meta.env.VITE_LANGUAGE as "da" | "en"}
/>
```

### Important Notes

- **JWT Tokens**: Never put JWT tokens or customer credentials in `.env` files. These should come from your authentication system at runtime.
- **Customer Info**: Customer IDs and names should be passed as props from your application, not from environment variables.
- **Required Variables**: `VITE_SERVER_URL` and `VITE_AGENT_ID` are required for the chatbot to work.
- **Git**: Make sure `.env` is in your `.gitignore` file (already included in `.env.example`).

### Environment-Specific Configuration

You can create multiple environment files for different deployments:

- `.env.local` - Local development (not committed)
- `.env.development` - Development environment
- `.env.production` - Production environment

Vite will automatically load the correct file based on the build mode.

## TypeScript Support

The component is fully typed. Import types for better development experience:

```tsx
import { ParlantChatBot, ParlantChatBotProps, PollingConfig } from "./Chat";

// Type-safe configuration
const config: ParlantChatBotProps = {
  serverUrl: "https://api.example.com",
  agentId: "agent-123",
  language: "da",
  pollingConfig: {
    active: 500,
    normal: 1000,
    idle: 3000,
    veryIdle: 5000,
  },
};

function App() {
  return <ParlantChatBot {...config} />;
}
```

## Troubleshooting

### Component not rendering

- Ensure all required props are provided
- Check that serverUrl is accessible
- Verify agentId exists in your Parlant instance

### JWT not working

- Check JWT token format matches expected structure
- Ensure token has `sub` and `name` claims
- Verify token is not expired

### Polling too slow/fast

- Adjust `pollingConfig` based on your needs
- Monitor network traffic in browser DevTools
- Balance between responsiveness and server load

### Event Polling Timeout Errors

- The component automatically handles long-polling with proper timeouts
- HTTP request timeout is set to `waitForData + 10 seconds` by default
- If you see timeout errors, check your network connection and server availability

### Styling conflicts

- The component uses Tailwind CSS
- Ensure Tailwind is properly configured
- You may need to adjust your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  important: true, // Make Tailwind classes more specific
  // ... rest of config
};
```

## Examples

See the following files for complete working examples:

- **[ParlantChatBot.example.tsx](./src/ParlantChatBot.example.tsx)** - 14 comprehensive authentication examples including Microsoft AD, Keycloak, WordPress, and more
- **[AUTH_INTEGRATION.md](./AUTH_INTEGRATION.md)** - Detailed authentication integration guide
- **[SETUP.md](./SETUP.md)** - Environment configuration guide
