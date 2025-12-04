# Authentication Integration Guide

This guide covers how to integrate the Parlant ChatBot with various authentication providers.

## Quick Start

```tsx
import { ParlantChatBot } from "./Chat";

function App({ authToken }: { authToken: string }) {
  return (
    <ParlantChatBot
      serverUrl="http://localhost:8800"
      agentId="your-agent-id"
      authToken={authToken}
      authProvider="microsoft" // Specify your provider
    />
  );
}
```

## Supported Providers

| Provider | Key | Claims Mapped |
|----------|-----|---------------|
| Microsoft Azure AD | `microsoft` | `oid` → customerId, `name` → customerName |
| Keycloak | `keycloak` | `sub` → customerId, `preferred_username` → customerName |
| Auth0 | `auth0` | `sub` → customerId, `name` → customerName |
| Okta | `okta` | `sub` → customerId, `name` → customerName |
| Google OAuth | `google` | `sub` → customerId, `name` → customerName |
| WordPress | `wordpress` | `data.user.id` → customerId, `user_display_name` → customerName |
| Generic OIDC | `generic` | Standard OIDC claims |

## Integration Examples

### Microsoft Azure AD

```tsx
import { useMsal } from "@azure/msal-react";
import { ParlantChatBot } from "./Chat";

function AzureADChat() {
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
      serverUrl="http://localhost:8800"
      agentId="your-agent-id"
      authToken={accessToken}
      authProvider="microsoft"
    />
  );
}
```

### Keycloak

```tsx
import { useKeycloak } from "@react-keycloak/web";
import { ParlantChatBot } from "./Chat";

function KeycloakChat() {
  const { keycloak } = useKeycloak();

  if (!keycloak.authenticated || !keycloak.token) {
    return <div>Please log in</div>;
  }

  return (
    <ParlantChatBot
      serverUrl="http://localhost:8800"
      agentId="your-agent-id"
      authToken={keycloak.token}
      authProvider="keycloak"
    />
  );
}
```

### Auth0

```tsx
import { useAuth0 } from "@auth0/auth0-react";
import { ParlantChatBot } from "./Chat";

function Auth0Chat() {
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
      serverUrl="http://localhost:8800"
      agentId="your-agent-id"
      authToken={token}
      authProvider="auth0"
    />
  );
}
```

## Token Refresh

Handle token refresh in your application:

```tsx
function ChatWithRefresh() {
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  const refreshToken = React.useCallback(async () => {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    setAuthToken(data.accessToken);
  }, []);

  // Auto-refresh every 50 minutes
  React.useEffect(() => {
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken]);

  if (!authToken) return <div>Authenticating...</div>;

  return (
    <ParlantChatBot
      serverUrl="http://localhost:8800"
      agentId="your-agent-id"
      authToken={authToken}
      authProvider="microsoft"
    />
  );
}
```

## Custom Token Adapter

For custom auth systems:

```tsx
import { createCustomAdapter } from "./Chat/utils/tokenAdapter";

const customAdapter = createCustomAdapter({
  name: "My Custom SSO",
  customerIdClaims: ["userId", "employeeId", "sub"],
  customerNameClaims: ["fullName", "displayName", "name"],
});

const customerInfo = customAdapter.extractCustomerInfo(jwtToken);

<ParlantChatBot
  serverUrl="http://localhost:8800"
  agentId="your-agent-id"
  authToken={jwtToken}
  customerId={customerInfo?.customerId}
  customerName={customerInfo?.customerName}
/>
```

## Security Best Practices

### ✅ DO

- Obtain JWT tokens from your auth system at runtime
- Use HTTPS for all API requests
- Implement token refresh mechanisms
- Store tokens securely (httpOnly cookies preferred)
- Enable `enableLogging={true}` during development

### ❌ DON'T

- Put JWT tokens in `.env` files
- Commit tokens to version control
- Expose tokens in URLs
- Skip server-side token validation

## Debugging

Enable logging to see JWT validation warnings:

```tsx
<ParlantChatBot
  authToken={authToken}
  enableLogging={true}
/>
```

Validation checks:
- Token format is valid
- Token is not expired
- Required claims are present
