/**
 * ChatInput - Presentation component for message input area
 * Follows ADR-004: Separation of Concerns - Pure presentation component
 */

import React from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * Props for ChatInput component
 */
interface ChatInputProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when message should be sent */
  onSend: () => void;
  /** Callback for key press events */
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Placeholder text */
  placeholder: string;
  /** Whether input is disabled */
  disabled: boolean;
  /** Whether to show loading indicator */
  isLoading: boolean;
  /** Whether to show attribution */
  showAttribution?: boolean;
}

/**
 * ChatInput - Pure presentation component for chat message input
 * 
 * @example
 * ```tsx
 * <ChatInput
 *   value={inputMessage}
 *   onChange={setInputMessage}
 *   onSend={sendMessage}
 *   placeholder="Type a message..."
 *   disabled={false}
 *   isLoading={false}
 * />
 * ```
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder,
  disabled,
  isLoading,
  showAttribution = true
}) => {
  return (
    <div className="bg-card border-t border-border p-2 sm:p-3 m-1 sm:m-2 rounded-md">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-12 bg-background border border-input focus:border-ring text-foreground placeholder-muted-foreground rounded-md px-4 text-sm transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="w-12 h-12 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>

      {/* Powered by Parlant attribution */}
      {showAttribution && (
        <div className="flex items-center justify-center mt-2 sm:mt-3">
          <a
            href="https://www.parlant.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Powered by</span>
            <span className="font-semibold">Parlant</span>
          </a>
        </div>
      )}
    </div>
  );
};

