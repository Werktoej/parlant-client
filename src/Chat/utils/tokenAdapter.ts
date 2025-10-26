/**
 * Token Adapter - Translates JWT tokens from different auth providers
 * to the chatbot's internal token structure requirements.
 * 
 * This allows easy integration with any authentication system by mapping
 * their specific claim names to the chatbot's expected claims.
 */

import { parseJWT, type JWTPayload } from './jwt';
import { log, logWarn } from './logger';

/**
 * Customer information extracted from JWT token
 */
export interface CustomerInfo {
  customerId: string;
  customerName?: string;
}

/**
 * Configuration for a specific auth provider
 * Defines which JWT claims to use for customer ID and name
 */
export interface AuthProviderConfig {
  /** Name of the auth provider (for logging) */
  name: string;
  /** Array of possible claim names for customer ID (tried in order) */
  customerIdClaims: string[];
  /** Array of possible claim names for customer name (tried in order) */
  customerNameClaims: string[];
  /** Optional custom extractor function for complex scenarios */
  customExtractor?: (payload: JWTPayload) => Partial<CustomerInfo>;
}

/**
 * Pre-configured auth provider mappings
 */
export const AUTH_PROVIDERS: Record<string, AuthProviderConfig> = {
  /**
   * Microsoft Azure Active Directory (Azure AD / Entra ID)
   * Common claims: oid, sub, name, preferred_username, email
   */
  microsoft: {
    name: 'Microsoft Azure AD',
    customerIdClaims: ['oid', 'sub', 'preferred_username'],
    customerNameClaims: ['name', 'given_name', 'displayName'],
  },

  /**
   * Keycloak
   * Common claims: sub, preferred_username, name, email
   */
  keycloak: {
    name: 'Keycloak',
    customerIdClaims: ['sub', 'preferred_username', 'email'],
    customerNameClaims: ['name', 'given_name', 'preferred_username'],
  },

  /**
   * Auth0
   * Common claims: sub, nickname, name, email
   */
  auth0: {
    name: 'Auth0',
    customerIdClaims: ['sub', 'user_id'],
    customerNameClaims: ['name', 'nickname', 'given_name'],
  },

  /**
   * Okta
   * Common claims: sub, uid, email, preferred_username
   */
  okta: {
    name: 'Okta',
    customerIdClaims: ['sub', 'uid', 'preferred_username'],
    customerNameClaims: ['name', 'given_name', 'preferred_username'],
  },

  /**
   * Google OAuth
   * Common claims: sub, email, name
   */
  google: {
    name: 'Google OAuth',
    customerIdClaims: ['sub', 'email'],
    customerNameClaims: ['name', 'given_name'],
  },

  /**
   * WordPress JWT Authentication
   * Common claims: data.user.id (nested), user_email, user_display_name
   * Uses custom extractor for nested structure
   */
  wordpress: {
    name: 'WordPress JWT Auth',
    customerIdClaims: ['data.user.id', 'sub', 'user_id'],
    customerNameClaims: ['user_display_name', 'user_nicename', 'name'],
    customExtractor: (payload: JWTPayload) => {
      // WordPress stores user ID in nested structure: data.user.id
      const data = payload.data as { user?: { id?: string | number } } | undefined;
      const userId = data?.user?.id || payload.sub || payload.user_id;
      const displayName = payload.user_display_name || payload.user_nicename || payload.name;

      return {
        customerId: userId ? String(userId) : undefined,
        customerName: displayName ? String(displayName) : undefined,
      };
    },
  },

  /**
   * Generic/Standard OIDC
   * Uses standard OpenID Connect claims
   */
  generic: {
    name: 'Generic OIDC',
    customerIdClaims: ['sub', 'user_id', 'id', 'preferred_username', 'email'],
    customerNameClaims: ['name', 'given_name', 'nickname', 'preferred_username'],
  },
};

/**
 * Token Adapter class for translating JWT tokens from various auth providers
 */
export class TokenAdapter {
  private config: AuthProviderConfig;

  /**
   * Creates a new TokenAdapter
   * @param providerKey - Key from AUTH_PROVIDERS or custom config
   * @param customConfig - Optional custom provider configuration
   */
  constructor(
    providerKey: string = 'generic',
    customConfig?: AuthProviderConfig
  ) {
    if (customConfig) {
      this.config = customConfig;
    } else if (AUTH_PROVIDERS[providerKey]) {
      this.config = AUTH_PROVIDERS[providerKey];
    } else {
      logWarn(`Unknown auth provider "${providerKey}", using generic configuration`);
      this.config = AUTH_PROVIDERS.generic;
    }

    log(`TokenAdapter initialized for ${this.config.name}`);
  }

  /**
   * Extracts customer information from a JWT token
   * @param token - JWT token string
   * @returns Customer information or null if extraction fails
   */
  public extractCustomerInfo(token: string): CustomerInfo | null {
    try {
      const payload = parseJWT(token);

      // Try custom extractor first if provided
      if (this.config.customExtractor) {
        const customResult = this.config.customExtractor(payload);
        if (customResult.customerId) {
          return {
            customerId: customResult.customerId,
            customerName: customResult.customerName,
          };
        }
      }

      // Extract customer ID
      const customerId = this.extractClaim(payload, this.config.customerIdClaims);
      if (!customerId) {
        logWarn(
          `Could not extract customer ID from token. Tried claims: ${this.config.customerIdClaims.join(', ')}`
        );
        return null;
      }

      // Extract customer name (optional)
      const customerName = this.extractClaim(payload, this.config.customerNameClaims);

      log(`Extracted customer info from ${this.config.name} token`, {
        customerId: customerId.substring(0, 8) + '...',
        hasCustomerName: !!customerName,
      });

      return {
        customerId,
        customerName,
      };
    } catch (error) {
      logWarn(`Failed to extract customer info from ${this.config.name} token:`, error);
      return null;
    }
  }

  /**
   * Extracts the first available claim from a list of possible claim names
   * @param payload - JWT payload
   * @param claimNames - Array of claim names to try (in order)
   * @returns The first found claim value as string, or undefined
   */
  private extractClaim(payload: JWTPayload, claimNames: string[]): string | undefined {
    for (const claimName of claimNames) {
      const value = this.getNestedClaim(payload, claimName);
      if (value) {
        return String(value);
      }
    }
    return undefined;
  }

  /**
   * Gets a claim value, supporting nested paths (e.g., "user.id")
   * @param payload - JWT payload
   * @param path - Claim name or nested path
   * @returns Claim value or undefined
   */
  private getNestedClaim(payload: JWTPayload, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = payload;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

/**
 * Creates a custom token adapter with specific claim mappings
 * Use this for auth providers not included in AUTH_PROVIDERS
 * 
 * @param config - Custom provider configuration
 * @returns TokenAdapter instance
 * 
 * @example
 * ```typescript
 * const adapter = createCustomAdapter({
 *   name: 'My Custom SSO',
 *   customerIdClaims: ['userId', 'user_id'],
 *   customerNameClaims: ['fullName', 'displayName']
 * });
 * 
 * const customerInfo = adapter.extractCustomerInfo(jwtToken);
 * ```
 */
export function createCustomAdapter(config: AuthProviderConfig): TokenAdapter {
  return new TokenAdapter('custom', config);
}

/**
 * Convenience function to extract customer info using a provider key
 * @param token - JWT token string
 * @param providerKey - Key from AUTH_PROVIDERS (default: 'generic')
 * @returns Customer information or null
 * 
 * @example
 * ```typescript
 * const info = extractCustomerInfo(token, 'microsoft');
 * ```
 */
export function extractCustomerInfo(
  token: string,
  providerKey: string = 'generic'
): CustomerInfo | null {
  const adapter = new TokenAdapter(providerKey);
  return adapter.extractCustomerInfo(token);
}

