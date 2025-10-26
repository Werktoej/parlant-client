/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required
  readonly VITE_SERVER_URL: string
  readonly VITE_AGENT_ID: string
  
  // Optional
  readonly VITE_SERVER_NAME?: string
  readonly VITE_AGENT_NAME?: string
  readonly VITE_LANGUAGE?: 'da' | 'en'
  readonly VITE_ENABLE_LOGGING?: string
  readonly VITE_INITIAL_MODE?: 'minimized' | 'popup' | 'fullscreen'
  readonly VITE_AUTO_START_SESSION?: string
  readonly VITE_SHOW_ATTRIBUTION?: string
  
  // Polling configuration
  readonly VITE_POLLING_ACTIVE?: string
  readonly VITE_POLLING_NORMAL?: string
  readonly VITE_POLLING_IDLE?: string
  readonly VITE_POLLING_VERY_IDLE?: string
  readonly VITE_POLLING_IDLE_THRESHOLD?: string
  readonly VITE_POLLING_VERY_IDLE_THRESHOLD?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
