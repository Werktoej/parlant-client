/**
 * Custom hook for extracting and managing customer information
 * Supports multiple auth providers through token adapter
 */

import { useState, useEffect } from 'react';
import { isJWTExpired } from '../utils/jwt';
import { TokenAdapter } from '../utils/tokenAdapter';
import { logWarn } from '../utils/logger';
import type { CustomerInfo } from '../types/chat';

/**
 * Options for useCustomerInfo hook
 */
interface UseCustomerInfoOptions {
  /** Customer ID provided as prop (highest priority) */
  propCustomerId?: string;
  /** Customer name provided as prop */
  propCustomerName?: string;
  /** JWT authentication token to extract customer info from */
  authToken?: string;
  /** Auth provider key (microsoft, keycloak, auth0, okta, google, generic) */
  authProvider?: string;
}

/**
 * Hook for managing customer information with priority:
 * 1. Props (propCustomerId/propCustomerName)
 * 2. JWT token extraction (using provider-specific adapter)
 * 3. Default to 'guest'
 * 
 * @param options - Customer information options
 * @returns Customer information object
 */
export const useCustomerInfo = ({
  propCustomerId,
  propCustomerName,
  authToken,
  authProvider = 'generic',
}: UseCustomerInfoOptions): CustomerInfo => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    // Priority: props > JWT > defaults
    if (propCustomerId) {
      return {
        customerId: propCustomerId,
        customerName: propCustomerName,
      };
    }

    if (authToken) {
      // Check if token is expired before extracting
      if (isJWTExpired(authToken)) {
        logWarn('JWT token is expired. Authentication may fail.');
      }

      // Use TokenAdapter to extract customer info based on auth provider
      const adapter = new TokenAdapter(authProvider);
      const extracted = adapter.extractCustomerInfo(authToken);

      if (extracted) {
        return {
          customerId: extracted.customerId,
          customerName: propCustomerName || extracted.customerName,
        };
      }
    }

    // Default to guest mode
    return {
      customerId: 'guest',
      customerName: propCustomerName,
    };
  });

  // Update customer info if props or authToken change
  useEffect(() => {
    if (propCustomerId) {
      setCustomerInfo({
        customerId: propCustomerId,
        customerName: propCustomerName,
      });
    } else if (authToken) {
      // Check if token is expired before extracting
      if (isJWTExpired(authToken)) {
        logWarn('JWT token is expired. Authentication may fail.');
      }

      // Use TokenAdapter to extract customer info based on auth provider
      const adapter = new TokenAdapter(authProvider);
      const extracted = adapter.extractCustomerInfo(authToken);

      if (extracted) {
        setCustomerInfo({
          customerId: extracted.customerId,
          customerName: propCustomerName || extracted.customerName,
        });
      }
    }
  }, [authToken, propCustomerId, propCustomerName, authProvider]);

  return customerInfo;
};

