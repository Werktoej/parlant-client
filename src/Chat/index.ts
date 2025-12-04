/**
 * Main exports for the Parlant Chat components
 */

// Main component
export { ParlantChatBot, default as ParlantChatBotDefault } from './components/ParlantChatBot';

// Types
export type { ParlantChatBotProps } from './components/ParlantChatBot';
export type { PollingConfig } from './types/chat';
export type { Language } from './hooks/useTranslation';
export type { ButtonVariant } from '../lib/theme/types';

// Individual components (for advanced use cases)
export { ChatWindow } from './components/ChatWindow';
export { ChatInterface } from './components/ChatInterface';
export { FullScreenChatbot } from './components/FullScreenChatbot';
export { SessionList } from './components/SessionList';
export { WelcomeMessage } from './components/WelcomeMessage';
export { MessageBubble } from './components/MessageBubble';
export { MessageContent } from './components/MessageContent';
export { ChatInput } from './components/ChatInput';
export { ErrorDisplay } from './components/ErrorDisplay';
export { MessagesList } from './components/MessagesList';

// Utility functions
export {
  parseJWT,
  extractCustomerFromJWT,
  isJWTExpired
} from './utils/jwt';

export type { JWTPayload } from './utils/jwt';

