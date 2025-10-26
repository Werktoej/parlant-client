import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, type Language } from '../hooks/useTranslation';

/**
 * Props for the WelcomeMessage component
 */
interface WelcomeMessageProps {
  /** Agent name for display */
  agentName: string;
  /** Customer name for personalization */
  customerName?: string;
  /** Language for the interface */
  language?: Language;
  /** Callback when the message appears */
  onMessageAppear?: () => void;
  /** Delay before showing the message (in ms) */
  delay?: number;
  /** Whether to skip the typing animation (for already shown welcomes) */
  skipAnimation?: boolean;
}

/**
 * Reusable welcome message component that simulates a typing animation
 * and displays as a proper chat bubble
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  agentName,
  customerName,
  language = 'en',
  onMessageAppear,
  delay = 1000,
  skipAnimation = false
}) => {
  const [isTyping, setIsTyping] = useState<boolean>(!skipAnimation);
  const [showMessage, setShowMessage] = useState<boolean>(skipAnimation);
  const hasCalledAppear = useRef<boolean>(false);

  const { t } = useTranslation(language);

  // Reset tracking when skipAnimation changes (indicates new welcome context)
  useEffect(() => {
    hasCalledAppear.current = false;
  }, [skipAnimation]);

  useEffect(() => {
    if (hasCalledAppear.current) {
      return; // Already called, don't call again
    }

    if (skipAnimation) {
      // If skipping animation, immediately call onMessageAppear
      hasCalledAppear.current = true;
      onMessageAppear?.();
    } else {
      // Show typing indicator first
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setShowMessage(true);
        hasCalledAppear.current = true;
        onMessageAppear?.();
      }, delay);

      return () => clearTimeout(typingTimer);
    }
  }, [delay, onMessageAppear, skipAnimation]);

  const welcomeText = customerName
    ? `Hej ${customerName} - velkommen til ${agentName}!\n\n${t('welcome.subtitle')}`
    : `${t('welcome.title', { agentName })}!\n\n${t('welcome.subtitle')}`;

  if (isTyping) {
    // Typing indicator that looks like a regular message
    return (
      <div className="flex space-x-3 animate-in slide-in-from-left-5 duration-300">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-bold text-sm">F</span>
        </div>

        <div className="flex-1 max-w-[85%]">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 shadow-sm">
            {/* Message Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                {agentName}
              </span>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* Typing Animation */}
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-600 font-medium text-sm">
                {t('status.typing')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showMessage) {
    // Actual welcome message that looks like a regular message
    return (
      <div className="flex space-x-3 animate-in slide-in-from-left-5 duration-300">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-bold text-sm">F</span>
        </div>

        <div className="flex-1 max-w-[85%]">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 shadow-sm">
            {/* Message Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                {agentName}
              </span>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* Message Content */}
            <div className="leading-relaxed font-medium whitespace-pre-wrap text-gray-800">
              {welcomeText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
