# Authentication Integration Guide

This guide covers how to integrate the Parlant ChatBot with various authentication providers.

## Overview

The ParlantChatBot component is designed to work with authenticated users via JWT tokens from various identity providers. The component automatically extracts customer information from JWT tokens based on the auth provider type.

## Supported Authentication Providers

The `authProvider` prop enables automatic JWT claim mapping for:

- **`microsoft`** - Microsoft Azure AD / Entra ID
- **`keycloak`** - Keycloak (open-source identity management)
- **`auth0`** - Auth0 identity platform
- **`okta`** - Okta identity platform
- **`google`** - Google OAuth
- **`wordpress`** - WordPress JWT Authentication plugin
- **`generic`** - Default OIDC-compliant providers (tries common claims)

## Quick Start

### Basic Authenticated Setup

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
      authProvider="microsoft" // Specify your provider
    />
  );
}
```

## Integration Examples

### Microsoft Azure AD

```tsx
import { useMsal } from "@azure/msal-react";
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function AzureADChat() {
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
        .then((response) => {
          setAccessToken(response.accessToken);
        });
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

**Azure AD JWT Claims Mapped:**

- `oid` → `customerId`
- `name` or `preferred_username` → `customerName`

### Keycloak

```tsx
import { useKeycloak } from "@react-keycloak/web";
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function KeycloakChat() {
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

**Keycloak JWT Claims Mapped:**

- `sub` → `customerId`
- `preferred_username` or `name` → `customerName`

### Auth0

```tsx
import { useAuth0 } from "@auth0/auth0-react";
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function Auth0Chat() {
  const envConfig = getEnvConfig();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then(setToken);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  if (!token) return <div>Authenticating...</div>;

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={token}
      authProvider="auth0" // Automatic Auth0 claim mapping
    />
  );
}
```

**Auth0 JWT Claims Mapped:**

- `sub` → `customerId`
- `name` or `nickname` → `customerName`

### WordPress JWT Auth

```tsx
import { ParlantChatBot } from "./Chat";
import { getEnvConfig } from "./config/envConfig";

function WordPressChat() {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  const loginToWordPress = async () => {
    const response = await fetch(
      "https://your-wp-site.com/wp-json/jwt-auth/v1/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "your-username",
          password: "your-password",
        }),
      }
    );

    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
    }
  };

  React.useEffect(() => {
    loginToWordPress();
  }, []);

  if (!authToken) return <div>Authenticating...</div>;

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="wordpress" // Automatic WordPress claim mapping
    />
  );
}
```

**WordPress JWT Claims Mapped:**

- `data.user.id` → `customerId`
- `data.user.user_display_name` → `customerName`

## Token Refresh

Handle token refresh in your application to ensure continuous authentication:

```tsx
function ChatWithRefresh() {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  const refreshToken = React.useCallback(async () => {
    try {
      const response = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      setAuthToken(data.accessToken);
    } catch (error) {
      console.error("Token refresh failed:", error);
      window.location.href = "/login";
    }
  }, []);

  // Auto-refresh every 50 minutes
  React.useEffect(() => {
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken]);

  // Initial token fetch
  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setAuthToken(token);
    } else {
      refreshToken();
    }
  }, [refreshToken]);

  if (!authToken) return <div>Authenticating...</div>;

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

## Security Best Practices

### ✅ DO

- Always obtain JWT tokens from your authentication system at runtime
- Use HTTPS for all API requests
- Implement token refresh mechanisms
- Store tokens securely (httpOnly cookies when possible)
- Validate tokens on both client and server side
- Set appropriate token expiration times

### ❌ DON'T

- Never put JWT tokens in `.env` files
- Never commit tokens to version control
- Never expose tokens in URLs or client-side storage unnecessarily
- Never skip token validation on the server
- Don't store long-lived tokens in localStorage without refresh mechanism

## Overriding Customer Information

You can override the JWT-derived customer name if needed:

```tsx
<ParlantChatBot
  serverUrl={envConfig.serverUrl}
  agentId={envConfig.agentId}
  authToken={authToken}
  customerName="Preferred Display Name" // Overrides JWT name claim
/>
```

Note: The `customerId` cannot be overridden when using JWT authentication for security reasons.

## Error Handling

Handle authentication errors gracefully:

```tsx
function ChatWithErrorHandling() {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setAuthError("No authentication token found. Please log in.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      setAuthToken(token);
    }
  }, []);

  if (authError) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Authentication Required</h2>
        <p>{authError}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (!authToken) {
    return <div>Loading...</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      enableLogging={true}
    />
  );
}
```

## JWT Token Validation

The component will validate JWT tokens in development mode when `enableLogging={true}`:

```tsx
<ParlantChatBot
  serverUrl={envConfig.serverUrl}
  agentId={envConfig.agentId}
  authToken={authToken}
  enableLogging={true} // Enables JWT validation warnings
/>
```

Validation checks:

- Token format is valid
- Token is not expired
- Required claims are present

## Testing

For testing purposes, you can generate test JWT tokens:

```typescript
// Example test token (DO NOT use in production)
const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

For production, always use tokens from your actual authentication provider.

## Troubleshooting

### "JWT token is expired" warning

- Implement token refresh mechanism
- Check token expiration time (`exp` claim)
- Ensure system clocks are synchronized

### "Missing required 'sub' claim" error

- Verify your auth provider includes `sub` claim
- Check if you need to use a different `authProvider` value
- Consider using `generic` if your provider uses custom claims

### Customer info not extracted correctly

- Verify the `authProvider` prop matches your actual provider
- Enable logging to see what claims are available
- Check JWT payload at [jwt.io](https://jwt.io) for debugging

### Token not being sent to server

- Verify `authToken` prop is being passed correctly
- Check network tab to ensure Authorization header is present
- Verify server is configured to accept JWT tokens

## See Also

- [ParlantChatBot.example.tsx](./src/ParlantChatBot.example.tsx) - Complete working examples
- [SETUP.md](./SETUP.md) - Environment setup guide
- [README.md](./README.md) - General documentation
