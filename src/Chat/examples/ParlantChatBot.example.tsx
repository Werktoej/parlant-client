/**
 * Examples of how to use the ParlantChatBot component with JWT Authentication
 * 
 * All examples assume users are authenticated via Microsoft AD, Keycloak, or similar
 * and have a valid JWT token available.
 */

import React from 'react';
import { ParlantChatBot } from '../components/ParlantChatBot';
import { getEnvConfig } from '../../config/envConfig';
import { log } from '../utils/logger';

/**
 * Example 1: Basic authenticated setup (RECOMMENDED)
 * User is authenticated and JWT token is passed from your auth system
 * This is the most common pattern for production applications
 */
export const AuthenticatedExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}  // JWT token from Microsoft AD/Keycloak
      language={envConfig.language}
      initialMode={envConfig.initialMode}
      autoStartSession={envConfig.autoStartSession}
      enableLogging={envConfig.enableLogging}
      showAttribution={envConfig.showAttribution}
      pollingConfig={envConfig.pollingConfig}
    />
  );
};

/**
 * Example 2: Integration with Microsoft Azure AD
 * Using @azure/msal-react for authentication
 * The authProvider="microsoft" automatically maps Azure AD token claims
 */
export const MicrosoftADExample: React.FC = () => {
  const envConfig = getEnvConfig();
  // In real app, use: const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simulate getting token from MSAL
    // In real app: instance.acquireTokenSilent({ scopes: ['User.Read'], account: accounts[0] })
    const token = localStorage.getItem('msal_token');
    if (token) {
      setAccessToken(token);
    }
  }, []);

  if (!accessToken) {
    return <div>Authenticating with Microsoft AD...</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={accessToken}
      authProvider="microsoft"  // 🎉 Automatic Azure AD claim mapping (oid → customerId)
      language={envConfig.language}
      enableLogging={true}
    />
  );
};

/**
 * Example 3: Integration with Keycloak
 * Using @react-keycloak/web for authentication
 * The authProvider="keycloak" automatically maps Keycloak token claims
 */
export const KeycloakExample: React.FC = () => {
  const envConfig = getEnvConfig();
  // In real app, use: const { keycloak } = useKeycloak();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simulate Keycloak authentication
    // In real app: check keycloak.authenticated and use keycloak.token
    const keycloakToken = localStorage.getItem('keycloak_token');
    if (keycloakToken) {
      setIsAuthenticated(true);
      setToken(keycloakToken);
    }
  }, []);

  if (!isAuthenticated || !token) {
    return <div>Authenticating with Keycloak...</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={token}
      authProvider="keycloak"  // 🎉 Automatic Keycloak claim mapping
      language={envConfig.language}
    />
  );
};

/**
 * Example 4: Integration with WordPress JWT Authentication
 * Using wp-api-jwt-auth plugin
 * The authProvider="wordpress" automatically maps WordPress token claims
 */
export const WordPressExample: React.FC = () => {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Simulate WordPress JWT login
  const loginToWordPress = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // In real app: call your WordPress site's JWT endpoint
      const response = await fetch('https://your-wordpress-site.com/wp-json/jwt-auth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'your-username',
          password: 'your-password'
        })
      });

      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
        // WordPress also returns: user_display_name, user_email, user_nicename
        localStorage.setItem('wp_jwt_token', data.token);
      }
    } catch (error) {
      log('WordPress login failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Check if we already have a token
    const existingToken = localStorage.getItem('wp_jwt_token');
    if (existingToken) {
      setAuthToken(existingToken);
    } else {
      loginToWordPress();
    }
  }, [loginToWordPress]);

  if (isLoading || !authToken) {
    return <div>Authenticating with WordPress...</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}
      authProvider="wordpress"  // 🎉 Automatic WordPress claim mapping (data.user.id → customerId)
      language={envConfig.language}
      enableLogging={true}
    />
  );
};

/**
 * Example 5: With custom customer info override
 * Useful when you want to display a different name than what's in the JWT token
 * The JWT token is still required for authentication
 */
export const WithCustomerNameOverrideExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}
      customerName="Preferred Display Name"  // Override JWT name claim
      language={envConfig.language}
    />
  );
};

/**
 * Example 6: With callbacks and custom configuration
 * Demonstrates all available options for authenticated users
 */
export const FullFeaturedExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  const handleSessionCreated = (sessionId: string) => {
    log('New session created:', sessionId);
    // Store session ID, send analytics, update backend, etc.
    fetch('/api/analytics/chat-started', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, timestamp: new Date() })
    });
  };

  const handleClose = () => {
    log('Chat was closed or minimized');
    // Track user behavior, show feedback form, etc.
  };

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}  // JWT token from Microsoft AD/Keycloak
      language={envConfig.language}
      initialMode={envConfig.initialMode}
      enableLogging={true}  // Enable for development
      pollingConfig={{
        active: 500,        // Poll every 500ms when bot is active
        normal: 1000,       // Poll every 1s normally
        idle: 3000,         // Poll every 3s when idle
        veryIdle: 5000,     // Poll every 5s when very idle
        idleThreshold: 10000,     // Consider idle after 10s
        veryIdleThreshold: 30000  // Consider very idle after 30s
      }}
      onSessionCreated={handleSessionCreated}
      onClose={handleClose}
      autoStartSession={true}
      showAttribution={envConfig.showAttribution}
    />
  );
};

/**
 * Example 7: Fullscreen mode for dedicated chat pages
 * Useful for dedicated chat pages with authenticated users
 */
export const FullscreenExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}
      initialMode="fullscreen"
      language={envConfig.language}
    />
  );
};

/**
 * Example 8: Start minimized
 * Chat appears as a floating button initially
 */
export const MinimizedExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      initialMode="minimized"
    />
  );
};

/**
 * Example 9: Multiple language support with runtime switching
 * Useful for multi-language applications where users can switch languages
 */
export const MultiLanguageExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();
  const [language, setLanguage] = React.useState<'da' | 'en'>(envConfig.language);

  return (
    <div>
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 100 }}>
        <button onClick={() => setLanguage('da')}>Dansk</button>
        <button onClick={() => setLanguage('en')}>English</button>
      </div>

      <ParlantChatBot
        serverUrl={envConfig.serverUrl}
        agentId={envConfig.agentId}
        authToken={authToken}
        language={language}
      />
    </div>
  );
};

/**
 * Example 10: Token refresh handling
 * Demonstrates how to handle token refresh in your parent application
 */
export const TokenRefreshExample: React.FC = () => {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = React.useState(true);

  // Simulate token refresh logic
  const refreshToken = React.useCallback(async () => {
    try {
      // In real app: call your auth provider's refresh endpoint
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      setAuthToken(data.accessToken);
      setIsTokenValid(true);
    } catch (error) {
      log('Token refresh failed:', error);
      setIsTokenValid(false);
      // Redirect to login
      window.location.href = '/login';
    }
  }, []);

  // Auto-refresh token every 50 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshToken();
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshToken]);

  // Initial token fetch
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
    } else {
      refreshToken();
    }
  }, [refreshToken]);

  if (!authToken || !isTokenValid) {
    return <div>Authenticating...</div>;
  }

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      enableLogging={true}
    />
  );
};

/**
 * Example 11: Integration with existing React app state
 * Track chat sessions and sync with your application state
 */
export const StatefulExample: React.FC<{ authToken: string; userId: string }> = ({ authToken, userId }) => {
  const envConfig = getEnvConfig();
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [chatHistory, setChatHistory] = React.useState<string[]>([]);

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setChatHistory(prev => [...prev, sessionId]);

    // Store in your backend, analytics, etc.
    fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ sessionId, userId })
    });
  };

  return (
    <div>
      <div style={{ padding: '20px' }}>
        <h1>Customer Support</h1>
        <p>Current session: {currentSessionId || 'None'}</p>
        <p>Total sessions: {chatHistory.length}</p>
      </div>

      <ParlantChatBot
        serverUrl={envConfig.serverUrl}
        agentId={envConfig.agentId}
        authToken={authToken}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
};

/**
 * Example 12: Custom polling for high-traffic scenarios
 * Use slower polling to reduce server load
 * You can also configure this in .env for production
 */
export const OptimizedPollingExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      pollingConfig={{
        active: 1000,       // Slower even when active
        normal: 2000,       // Much slower normally
        idle: 5000,         // Very slow when idle
        veryIdle: 10000,    // Extremely slow when very idle
        idleThreshold: 20000,
        veryIdleThreshold: 60000
      }}
    />
  );
};

/**
 * Example 13: Hide "Powered by Parlant" attribution
 * Useful for white-label integrations
 * Can also be configured in .env with VITE_SHOW_ATTRIBUTION=false
 */
export const NoAttributionExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      agentName={envConfig.agentName}
      authToken={authToken}
      showAttribution={false}
    />
  );
};

/**
 * Example 14: Error handling and auth failure recovery
 * Handle authentication errors gracefully
 */
export const ErrorHandlingExample: React.FC = () => {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthError('No authentication token found. Please log in.');
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setAuthToken(token);
    }
  }, []);

  if (authError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
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
};

// Default export showing the recommended approach
export default AuthenticatedExample;

