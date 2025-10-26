/**
 * HTTP utility functions for consistent API communication
 */

/**
 * Interface for HTTP request options
 */
export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Creates authorization headers for requests
 * @param authToken - Optional authentication token
 * @returns Headers object with authorization if token provided
 */
export const createAuthHeaders = (authToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

/**
 * Makes an authenticated HTTP request with consistent error handling
 * @param url - Request URL
 * @param options - Request options
 * @param authToken - Optional authentication token
 * @returns Promise resolving to response data
 */
export const makeAuthenticatedRequest = async <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
  authToken?: string
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    signal
  } = options;

  const authHeaders = createAuthHeaders(authToken);
  const requestHeaders = { ...authHeaders, ...headers };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Use provided signal or create new one
  const requestSignal = signal || controller.signal;

  try {
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: requestSignal,
    };

    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      // Provide more specific error messages for common issues
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired token. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to perform this action.');
      }

      if (response.status === 504) {
        throw new Error(`Failed to fetch events: 504`);
      }

      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error;
  }
};

/**
 * Creates a URL with query parameters
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns URL with parameters
 */
export const createUrlWithParams = (
  baseUrl: string,
  params: Record<string, string | number>
): string => {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
};
