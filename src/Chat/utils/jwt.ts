/**
 * JWT utility functions for parsing and extracting data from JWT tokens
 */

import { logWarn, logError } from './logger';

/**
 * Interface for decoded JWT payload
 */
export interface JWTPayload {
  sub?: string;      // Subject - typically used as customer ID
  name?: string;     // Name of the user
  iat?: number;      // Issued at
  exp?: number;      // Expiration time
  [key: string]: unknown; // Allow other custom claims
}

/**
 * Decodes a base64url encoded string
 * @param str - The base64url encoded string
 * @returns The decoded string
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  try {
    // Decode base64 and handle UTF-8
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    throw new Error('Failed to decode base64url string');
  }
}

/**
 * Parses a JWT token and extracts the payload
 * @param token - The JWT token string
 * @returns The decoded payload object
 * @throws Error if the token is invalid or cannot be parsed
 */
export function parseJWT(token: string): JWTPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: Token must be a non-empty string');
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid token: JWT must have 3 parts (header.payload.signature)');
  }

  try {
    const payload = parts[1];
    const decodedPayload = base64UrlDecode(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    throw new Error(`Failed to parse JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts customer information from a JWT token
 * @param token - The JWT token string
 * @returns Object containing customerId and customerName, or null if extraction fails
 */
export function extractCustomerFromJWT(token: string): { customerId: string; customerName?: string } | null {
  try {
    const payload = parseJWT(token);

    // Extract subject (customerId) - this is typically the user ID
    const customerId = payload.sub;

    if (!customerId) {
      logWarn('JWT token does not contain a "sub" claim for customer ID');
      return null;
    }

    // Extract name if available
    const customerName = payload.name;

    return {
      customerId,
      customerName
    };
  } catch (error) {
    logError('Failed to extract customer info from JWT:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token string
 * @returns True if the token is expired, false otherwise
 */
export function isJWTExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);

    if (!payload.exp) {
      // If no expiration time is set, consider it as not expired
      return false;
    }

    // JWT exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  } catch (error) {
    logError('Failed to check JWT expiration:', error);
    // If we can't parse it, consider it expired to be safe
    return true;
  }
}

