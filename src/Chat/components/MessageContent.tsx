/**
 * MessageContent - Component for rendering rich content in chat messages
 * 
 * Parses message text and renders:
 * - Standard markdown links: [text](url) → <a href="url" target="_blank">text</a>
 * - Custom button syntax: [btn:Label](url) → styled button element
 * - Button variants: [btn:Label:variant](url) → colored button element
 * 
 * Supported button variants:
 * - default: theme accent color
 * - primary: theme primary color
 * - success, accept, yes: green confirmation button
 * - danger, reject, no: red decline button
 * - warning, maybe: amber/yellow uncertain button
 * - info: blue informational button
 * - neutral: gray neutral button
 * 
 * Follows ADR principles:
 * - ADR-003: High Cohesion - Single responsibility: parse and render rich content
 * - ADR-004: Separation of Concerns - Pure presentation component
 */

import React, { useMemo } from 'react';
import type { ButtonVariant } from '../../lib/theme/types';

/**
 * Props for MessageContent component
 */
interface MessageContentProps {
  /** The raw message content to parse and render */
  content: string;
  /** Optional callback when a button is clicked */
  onButtonClick?: (url: string, label: string, variant?: ButtonVariant) => void;
  /** Whether this is a customer message (affects link styling) */
  isCustomerMessage?: boolean;
}

/**
 * Represents a parsed segment of the message
 */
type ContentSegment = 
  | { type: 'text'; content: string }
  | { type: 'link'; label: string; url: string }
  | { type: 'button'; label: string; url: string; variant: ButtonVariant };

/**
 * Regex pattern for matching markdown links and buttons
 * Matches: [text](url) or [btn:text](url) or [btn:text:variant](url)
 * Groups: 1=full label (may include btn: prefix and variant), 2=url
 */
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Normalizes button variant aliases to canonical names
 * 
 * @param variant - The variant string from the markdown
 * @returns Normalized ButtonVariant
 */
function normalizeVariant(variant: string): ButtonVariant {
  const normalized = variant.toLowerCase().trim();
  
  // Map aliases to canonical variants
  const aliasMap: Record<string, ButtonVariant> = {
    'accept': 'success',
    'yes': 'success',
    'reject': 'danger',
    'no': 'danger',
    'maybe': 'warning',
  };
  
  return aliasMap[normalized] || (normalized as ButtonVariant) || 'default';
}

/**
 * Parses message content into segments of text, links, and buttons
 * 
 * @param content - The raw message content to parse
 * @returns Array of parsed content segments
 */
function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(content)) !== null) {
    // Add preceding text if any
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    const fullLabel = match[1];
    const url = match[2];

    // Check if this is a button (btn: prefix)
    if (fullLabel.startsWith('btn:')) {
      const buttonContent = fullLabel.slice(4); // Remove 'btn:' prefix
      
      // Check for variant syntax: Label:variant
      const lastColonIndex = buttonContent.lastIndexOf(':');
      
      if (lastColonIndex > 0) {
        // Has variant
        const label = buttonContent.slice(0, lastColonIndex);
        const variantStr = buttonContent.slice(lastColonIndex + 1);
        segments.push({
          type: 'button',
          label,
          url,
          variant: normalizeVariant(variantStr)
        });
      } else {
        // No variant, use default
        segments.push({
          type: 'button',
          label: buttonContent,
          url,
          variant: 'default'
        });
      }
    } else {
      segments.push({
        type: 'link',
        label: fullLabel,
        url
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text if any
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return segments;
}

/**
 * Renders a link segment as an anchor element
 */
const LinkSegment: React.FC<{
  label: string;
  url: string;
  isCustomerMessage: boolean;
}> = ({ label, url, isCustomerMessage }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={`underline underline-offset-2 hover:opacity-80 transition-opacity ${
      isCustomerMessage 
        ? 'decoration-primary-foreground/50 hover:decoration-primary-foreground' 
        : 'decoration-card-foreground/50 hover:decoration-card-foreground'
    }`}
  >
    {label}
  </a>
);

/**
 * Gets the CSS classes for a button variant
 * 
 * @param variant - The button variant
 * @param isCustomerMessage - Whether this is in a customer message bubble
 * @returns CSS class string
 */
function getButtonVariantStyles(variant: ButtonVariant, isCustomerMessage: boolean): string {
  // For customer messages, use semi-transparent styling
  if (isCustomerMessage) {
    return 'bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/30';
  }

  // For agent messages, use themed variant colors
  switch (variant) {
    case 'success':
    case 'accept':
    case 'yes':
      return 'bg-[hsl(var(--btn-success))] text-[hsl(var(--btn-success-foreground))] border border-[hsl(var(--btn-success))]/20 hover:bg-[hsl(var(--btn-success))]/90';
    
    case 'danger':
    case 'reject':
    case 'no':
      return 'bg-[hsl(var(--btn-danger))] text-[hsl(var(--btn-danger-foreground))] border border-[hsl(var(--btn-danger))]/20 hover:bg-[hsl(var(--btn-danger))]/90';
    
    case 'warning':
    case 'maybe':
      return 'bg-[hsl(var(--btn-warning))] text-[hsl(var(--btn-warning-foreground))] border border-[hsl(var(--btn-warning))]/20 hover:bg-[hsl(var(--btn-warning))]/90';
    
    case 'info':
      return 'bg-[hsl(var(--btn-info))] text-[hsl(var(--btn-info-foreground))] border border-[hsl(var(--btn-info))]/20 hover:bg-[hsl(var(--btn-info))]/90';
    
    case 'neutral':
      return 'bg-[hsl(var(--btn-neutral))] text-[hsl(var(--btn-neutral-foreground))] border border-[hsl(var(--btn-neutral))]/20 hover:bg-[hsl(var(--btn-neutral))]/90';
    
    case 'primary':
      return 'bg-primary text-primary-foreground border border-primary/20 hover:bg-primary/90';
    
    case 'default':
    default:
      return 'bg-accent text-accent-foreground border border-accent-foreground/20 hover:bg-accent/80 shadow-sm';
  }
}

/**
 * Renders a button segment as a styled button element
 */
const ButtonSegment: React.FC<{
  label: string;
  url: string;
  variant: ButtonVariant;
  onClick?: (url: string, label: string, variant?: ButtonVariant) => void;
  isCustomerMessage: boolean;
}> = ({ label, url, variant, onClick, isCustomerMessage }) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    
    if (onClick) {
      onClick(url, label, variant);
    } else {
      // Default behavior: open URL in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const variantStyles = getButtonVariantStyles(variant, isCustomerMessage);

  return (
    <button
      onClick={handleClick}
      data-variant={variant}
      className={`inline-flex items-center px-3 py-1.5 mx-1 my-0.5 text-sm font-medium rounded-md 
        transition-all duration-200 ease-in-out
        hover:scale-[1.02] active:scale-[0.98]
        ${variantStyles}`}
    >
      {label}
    </button>
  );
};

/**
 * MessageContent - Parses and renders rich content in chat messages
 * 
 * @example
 * ```tsx
 * // Basic buttons and links
 * <MessageContent 
 *   content="Check out [our docs](https://example.com) or [btn:Sign Up](https://signup.com)"
 *   onButtonClick={(url, label) => console.log(`Button clicked: ${label}`)}
 * />
 * 
 * // Variant buttons for actions
 * <MessageContent 
 *   content="Would you like to proceed? [btn:Yes:accept](action:confirm) [btn:No:reject](action:cancel) [btn:Maybe Later:neutral](action:defer)"
 * />
 * ```
 */
export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  onButtonClick,
  isCustomerMessage = false
}) => {
  // Parse content into segments (memoized for performance)
  const segments = useMemo(() => parseContent(content), [content]);

  // If no links or buttons found, return plain text
  if (segments.length === 1 && segments[0].type === 'text') {
    return <>{content}</>;
  }

  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'text':
            return <span key={index}>{segment.content}</span>;
          
          case 'link':
            return (
              <LinkSegment
                key={index}
                label={segment.label}
                url={segment.url}
                isCustomerMessage={isCustomerMessage}
              />
            );
          
          case 'button':
            return (
              <ButtonSegment
                key={index}
                label={segment.label}
                url={segment.url}
                variant={segment.variant}
                onClick={onButtonClick}
                isCustomerMessage={isCustomerMessage}
              />
            );
          
          default:
            return null;
        }
      })}
    </>
  );
};

export type { MessageContentProps, ContentSegment };
