/**
 * Environment configuration loaded from Vite environment variables
 */

export interface PollingConfig {
    active: number;
    normal: number;
    idle: number;
    veryIdle: number;
    idleThreshold: number;
    veryIdleThreshold: number;
}

export interface EnvConfig {
    serverUrl: string;
    agentId: string;
    agentName: string;
    language: 'da' | 'en';
    enableLogging: boolean;
    initialMode: 'minimized' | 'popup' | 'fullscreen';
    autoStartSession: boolean;
    showAttribution: boolean;
    pollingConfig?: PollingConfig;
}

/**
 * Parses a boolean string from environment variables
 * @param value - The string value to parse
 * @param defaultValue - The default value if parsing fails
 * @returns The parsed boolean value
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

/**
 * Parses a number string from environment variables
 * @param value - The string value to parse
 * @param defaultValue - The default value if parsing fails
 * @returns The parsed number value
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Gets the polling configuration from environment variables
 * @returns PollingConfig object or undefined if not configured
 */
const getPollingConfig = (): PollingConfig | undefined => {
    const env = import.meta.env || {};

    // If no polling config is set, return undefined to use defaults
    if (!env.VITE_POLLING_ACTIVE && !env.VITE_POLLING_NORMAL) {
        return undefined;
    }

    return {
        active: parseNumber(env.VITE_POLLING_ACTIVE, 500),
        normal: parseNumber(env.VITE_POLLING_NORMAL, 1000),
        idle: parseNumber(env.VITE_POLLING_IDLE, 3000),
        veryIdle: parseNumber(env.VITE_POLLING_VERY_IDLE, 5000),
        idleThreshold: parseNumber(env.VITE_POLLING_IDLE_THRESHOLD, 10000),
        veryIdleThreshold: parseNumber(env.VITE_POLLING_VERY_IDLE_THRESHOLD, 30000),
    };
};

/**
 * Loads and validates environment configuration
 * @returns EnvConfig object with all configuration values
 */
export const getEnvConfig = (): EnvConfig => {
    const env = import.meta.env || {};

    return {
        serverUrl: env.VITE_SERVER_URL || 'http://localhost:8800',
        agentId: env.VITE_AGENT_ID || '',
        agentName: env.VITE_AGENT_NAME || 'AI Assistant',
        language: (env.VITE_LANGUAGE as 'da' | 'en') || 'en',
        enableLogging: parseBoolean(env.VITE_ENABLE_LOGGING, false),
        initialMode: (env.VITE_INITIAL_MODE as 'minimized' | 'popup' | 'fullscreen') || 'popup',
        autoStartSession: parseBoolean(env.VITE_AUTO_START_SESSION, true),
        showAttribution: parseBoolean(env.VITE_SHOW_ATTRIBUTION, true),
        pollingConfig: getPollingConfig(),
    };
};

/**
 * Validates that required environment variables are set
 * @throws Error if required variables are missing
 */
export const validateEnvConfig = (): void => {
    const env = import.meta.env || {};

    const missing: string[] = [];

    if (!env.VITE_SERVER_URL) {
        missing.push('VITE_SERVER_URL');
    }

    if (!env.VITE_AGENT_ID) {
        missing.push('VITE_AGENT_ID');
    }

    if (missing.length > 0) {
        console.warn(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please copy .env.example to .env and configure the required values.'
        );
    }
};

