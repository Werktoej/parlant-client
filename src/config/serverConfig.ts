/**
 * Server configuration interface
 */
export interface ServerConfig {
  name: string;
  url: string;
  default?: boolean;
}

/**
 * Get server configuration from environment variables
 * This builds the server config dynamically from .env settings
 */
const getServerConfigFromEnv = (): Record<string, ServerConfig> => {
  const config: Record<string, ServerConfig> = {};

  // Add localhost for development
  config["http://localhost:8800"] = {
    name: "Local Development",
    url: "http://localhost:8800"
  };

  // Add server from environment variable if available
  const envServerUrl = import.meta.env.VITE_SERVER_URL;
  const envServerName = import.meta.env.VITE_SERVER_NAME;

  if (envServerUrl && envServerUrl !== "http://localhost:8800") {
    config[envServerUrl] = {
      name: envServerName || "Production Server",
      url: envServerUrl,
      default: true
    };
  } else {
    // If no env server or it's localhost, make localhost default
    config["http://localhost:8800"].default = true;
  }

  return config;
};

/**
 * Server configuration object
 * Loaded dynamically from environment variables
 */
export const SERVER_CONFIG: Record<string, ServerConfig> = getServerConfigFromEnv();

/**
 * Get the default server URL from configuration
 * Returns the server URL from environment variables or falls back to localhost
 */
export const getDefaultServerUrl = (): string => {
  const envServerUrl = import.meta.env.VITE_SERVER_URL;
  if (envServerUrl) {
    return envServerUrl;
  }

  // Fallback to first server in config
  const defaultEntry = Object.entries(SERVER_CONFIG).find(([, config]) => config.default);
  return defaultEntry ? defaultEntry[0] : Object.keys(SERVER_CONFIG)[0];
};
