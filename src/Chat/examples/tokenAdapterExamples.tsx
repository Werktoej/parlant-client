/**
 * Examples demonstrating Token Adapter usage with different auth providers
 * 
 * The Token Adapter automatically maps JWT claims from various authentication
 * systems to the chatbot's internal requirements.
 */

import React from 'react';
import { ParlantChatBot } from '../components/ParlantChatBot';
import { createCustomAdapter, AUTH_PROVIDERS } from '../utils/tokenAdapter';
import { getEnvConfig } from '../../config/envConfig';

/**
 * Example 1: Using Microsoft Azure AD / Entra ID
 * 
 * Azure AD tokens typically have claims like:
 * - oid: Object ID (user's unique ID)
 * - name: Display name
 * - preferred_username: Email address
 */
export const MicrosoftAzureADExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="microsoft"  // Automatically maps Azure AD claims
      enableLogging={true}
    />
  );
};

/**
 * Example 2: Using Keycloak
 * 
 * Keycloak tokens typically have claims like:
 * - sub: Subject (unique user ID)
 * - preferred_username: Username
 * - name: Full name
 */
export const KeycloakExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="keycloak"  // Automatically maps Keycloak claims
    />
  );
};

/**
 * Example 3: Using Auth0
 * 
 * Auth0 tokens typically have claims like:
 * - sub: Subject (unique user ID)
 * - nickname: Username/nickname
 * - name: Full name
 */
export const Auth0Example: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="auth0"  // Automatically maps Auth0 claims
    />
  );
};

/**
 * Example 4: Using Okta
 * 
 * Okta tokens typically have claims like:
 * - sub: Subject (unique user ID)
 * - uid: User ID
 * - name: Full name
 */
export const OktaExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="okta"  // Automatically maps Okta claims
    />
  );
};

/**
 * Example 5: Using Google OAuth
 * 
 * Google tokens typically have claims like:
 * - sub: Subject (unique user ID)
 * - email: Email address
 * - name: Full name
 * - given_name: First name
 */
export const GoogleOAuthExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="google"  // Automatically maps Google OAuth claims
    />
  );
};

/**
 * Example 6: Using Generic/Standard OIDC
 * 
 * For standard OpenID Connect providers that follow the spec
 */
export const GenericOIDCExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      authProvider="generic"  // Default - tries common OIDC claims
    />
  );
};

/**
 * Example 7: Custom Auth Provider with Custom Adapter
 * 
 * For custom SSO systems or auth providers not in the built-in list.
 * This example shows how to create a custom adapter for a proprietary auth system.
 */
export const CustomAuthProviderExample: React.FC = () => {
  const envConfig = getEnvConfig();
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get token from your custom auth system
    const token = localStorage.getItem('custom_auth_token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  if (!authToken) {
    return <div>Loading...</div>;
  }

  // Create a custom adapter for your proprietary auth system
  // This example assumes your JWT has claims like:
  // - userId: Unique user identifier
  // - fullName: User's full name
  const customAdapter = createCustomAdapter({
    name: 'My Custom SSO',
    customerIdClaims: ['userId', 'user_id', 'sub'],  // Try these in order
    customerNameClaims: ['fullName', 'displayName', 'name'],
  });

  // Extract customer info using the custom adapter
  const customerInfo = customAdapter.extractCustomerInfo(authToken);

  if (!customerInfo) {
    return <div>Failed to extract customer information</div>;
  }

  // Pass extracted info to chatbot
  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      customerId={customerInfo.customerId}
      customerName={customerInfo.customerName}
    />
  );
};

/**
 * Example 8: Custom Adapter with Nested Claims
 * 
 * For auth systems that use nested JSON structures in their JWT tokens.
 * Example token structure:
 * {
 *   "user": {
 *     "id": "12345",
 *     "profile": {
 *       "name": "John Doe"
 *     }
 *   }
 * }
 */
export const NestedClaimsExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  const customAdapter = createCustomAdapter({
    name: 'Nested Claims Auth',
    customerIdClaims: ['user.id', 'userId', 'sub'],  // Supports dot notation
    customerNameClaims: ['user.profile.name', 'user.name', 'name'],
  });

  const customerInfo = customAdapter.extractCustomerInfo(authToken);

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      customerId={customerInfo?.customerId}
      customerName={customerInfo?.customerName}
    />
  );
};

/**
 * Example 9: Custom Extractor Function
 * 
 * For complex scenarios where you need custom logic to extract customer info.
 * This gives you full control over the extraction process.
 */
export const CustomExtractorExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();

  const customAdapter = createCustomAdapter({
    name: 'Complex Custom Auth',
    customerIdClaims: ['sub'],  // Fallback if customExtractor doesn't work
    customerNameClaims: ['name'],
    customExtractor: (payload) => {
      // Custom logic to extract customer info
      // For example, combining multiple fields
      const firstName = payload.first_name || payload.given_name;
      const lastName = payload.last_name || payload.family_name;
      const customerId = payload.employee_id || payload.sub;

      return {
        customerId: String(customerId),
        customerName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      };
    },
  });

  const customerInfo = customAdapter.extractCustomerInfo(authToken);

  return (
    <ParlantChatBot
      serverUrl={envConfig.serverUrl}
      agentId={envConfig.agentId}
      authToken={authToken}
      customerId={customerInfo?.customerId}
      customerName={customerInfo?.customerName}
    />
  );
};

/**
 * Example 10: Inspecting Available Auth Providers
 * 
 * Shows how to check what auth providers are available
 */
export const InspectProvidersExample: React.FC = () => {
  React.useEffect(() => {
    console.log('Available auth providers:', Object.keys(AUTH_PROVIDERS));

    // Log details of each provider
    Object.entries(AUTH_PROVIDERS).forEach(([key, config]) => {
      console.log(`\n${key} (${config.name}):`);
      console.log('  Customer ID claims:', config.customerIdClaims);
      console.log('  Customer name claims:', config.customerNameClaims);
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Available Auth Providers</h2>
      <p>Check the browser console for details</p>
      <ul>
        {Object.keys(AUTH_PROVIDERS).map((key) => (
          <li key={key}>
            <strong>{key}</strong>: {AUTH_PROVIDERS[key].name}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example 11: Runtime Provider Detection
 * 
 * Automatically detect which auth provider based on token claims
 */
export const AutoDetectProviderExample: React.FC<{ authToken: string }> = ({ authToken }) => {
  const envConfig = getEnvConfig();
  const [detectedProvider, setDetectedProvider] = React.useState<string>('generic');

  React.useEffect(() => {
    // Simple heuristic to detect provider
    // In reality, you'd know this from your auth configuration
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));

      if (payload.oid) {
        setDetectedProvider('microsoft');
      } else if (payload.azp && payload.azp.includes('google')) {
        setDetectedProvider('google');
      } else if (payload.iss && payload.iss.includes('auth0')) {
        setDetectedProvider('auth0');
      } else if (payload.iss && payload.iss.includes('okta')) {
        setDetectedProvider('okta');
      } else {
        setDetectedProvider('generic');
      }
    } catch {
      setDetectedProvider('generic');
    }
  }, [authToken]);

  return (
    <div>
      <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px' }}>
        Detected provider: <strong>{detectedProvider}</strong>
      </div>

      <ParlantChatBot
        serverUrl={envConfig.serverUrl}
        agentId={envConfig.agentId}
        authToken={authToken}
        authProvider={detectedProvider as 'microsoft' | 'google' | 'auth0' | 'okta' | 'keycloak' | 'wordpress' | 'generic'}
        enableLogging={true}
      />
    </div>
  );
};

export default MicrosoftAzureADExample;

