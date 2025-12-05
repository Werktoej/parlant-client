import React, { useState, useRef, useEffect } from 'react';
import { X, RefreshCw, ChevronDown, Check, Server, User, Globe, Monitor, Sun, Moon, Link, MessageSquare, Paintbrush } from 'lucide-react';
import { SERVER_CONFIG } from '../config/serverConfig';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';
import { log } from '../Chat/utils/logger';

/**
 * Tab configuration for the modal
 */
type ConfigTab = 'connection' | 'chat' | 'appearance' | 'auth';

const tabs: Array<{ id: ConfigTab; label: string; icon: React.ReactNode }> = [
  { id: 'connection', label: 'Connection', icon: <Link size={14} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
  { id: 'appearance', label: 'Appearance', icon: <Paintbrush size={14} /> },
  { id: 'auth', label: 'Auth', icon: <User size={14} /> },
];

/**
 * Configuration steps for the progress indicator
 */
interface ConfigStep {
  id: ConfigTab;
  label: string;
  required: boolean;
}

const configSteps: ConfigStep[] = [
  { id: 'connection', label: 'Connection', required: true },
  { id: 'chat', label: 'Chat', required: false },
  { id: 'appearance', label: 'Appearance', required: false },
  { id: 'auth', label: 'Auth', required: true },
];

/**
 * Step progress indicator component
 */
interface StepProgressProps {
  steps: ConfigStep[];
  completedSteps: Set<ConfigTab>;
  activeTab: ConfigTab;
  onStepClick: (step: ConfigTab) => void;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, completedSteps, activeTab, onStepClick }) => {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.id);
        const isActive = activeTab === step.id;
        
        return (
          <React.Fragment key={step.id}>
            {/* Step button */}
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex flex-col items-center gap-1 group transition-colors flex-shrink-0",
                isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all",
                isCompleted 
                  ? "bg-green-500 text-white" 
                  : isActive 
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20" 
                    : "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <Check size={12} /> : index + 1}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors whitespace-nowrap",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
                {step.required && !isCompleted && <span className="text-destructive ml-0.5">*</span>}
              </span>
            </button>
            
            {/* Connector line - centered with the circles */}
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center px-1 -mt-4">
                <div className={cn(
                  "w-full h-0.5 rounded-full transition-colors",
                  isCompleted && completedSteps.has(steps[index + 1].id)
                    ? "bg-green-500"
                    : "bg-muted"
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Custom dropdown item component for consistent styling
 */
interface DropdownItemProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  description?: string;
}

/**
 * Light/Dark mode toggle component
 */
const ModeToggle: React.FC = () => {
  const { effectiveMode, toggleMode } = useTheme();

  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-md">
      <button
        type="button"
        onClick={() => effectiveMode === 'dark' && toggleMode()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors',
          effectiveMode === 'light'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sun size={14} />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => effectiveMode === 'light' && toggleMode()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors',
          effectiveMode === 'dark'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Moon size={14} />
        <span>Dark</span>
      </button>
    </div>
  );
};

const DropdownItem: React.FC<DropdownItemProps> = ({ selected, onClick, children, description }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors rounded-md group',
      selected 
        ? 'bg-primary/15' 
        : 'hover:bg-muted/50'
    )}
  >
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm text-popover-foreground">
        {children}
      </div>
      {description && (
        <div className="text-xs truncate text-muted-foreground">
          {description}
        </div>
      )}
    </div>
    <div className={cn(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
      selected 
        ? 'border-primary bg-primary' 
        : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
    )}>
      {selected && <Check size={12} className="text-primary-foreground" />}
    </div>
  </button>
);

/**
 * Custom Agent Dropdown component
 */
interface AgentDropdownProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Simple dropdown for selecting from a list of options
 */
interface SimpleDropdownProps {
  icon: React.ReactNode;
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  icon,
  label,
  options,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        dropdownRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap (mt-2)
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 pr-10 py-3 bg-background border border-input rounded-md text-left transition-all duration-200 text-sm cursor-pointer hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring',
          isOpen && 'ring-2 ring-ring border-ring relative z-[100]'
        )}
      >
        <span className="text-foreground">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown
          size={18}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-[99] bg-black/5 backdrop-blur-[2px]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed z-[100] bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {icon}
                <span>{label}</span>
              </div>
            </div>
            <div className="p-1.5">
              {options.map((option) => (
                <DropdownItem
                  key={option.value}
                  selected={value === option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  description={option.description}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AgentDropdown: React.FC<AgentDropdownProps> = ({ 
  agents, 
  selectedAgentId, 
  onSelect, 
  isLoading, 
  hasError 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const isDisabled = hasError || isLoading || agents.length === 0;
  const displayText = hasError 
    ? 'Unable to load agents' 
    : isLoading 
    ? 'Loading agents...' 
    : agents.length === 0 
    ? 'No agents available' 
    : selectedAgent?.name || 'Select an agent...';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={cn(
          'w-full px-4 pr-10 py-3 bg-background border border-input rounded-md text-left transition-all duration-200 text-sm flex items-center justify-between',
          isDisabled 
            ? 'cursor-not-allowed bg-muted text-muted-foreground' 
            : 'cursor-pointer hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring',
          isOpen && 'ring-2 ring-ring border-ring relative z-[100]'
        )}
      >
        <span className={cn(
          selectedAgent ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {displayText}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && agents.length > 0 && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-[99] bg-black/5 backdrop-blur-[2px]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-[100] w-full mt-2 bg-popover border border-border rounded-md shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <User size={12} />
                <span>Available Agents</span>
              </div>
            </div>
            <div className="p-1.5 max-h-60 overflow-auto">
              {agents.map((agent) => (
                <DropdownItem
                  key={agent.id}
                  selected={selectedAgentId === agent.id}
                  onClick={() => {
                    onSelect(agent.id);
                    setIsOpen(false);
                  }}
                  description={agent.description || `ID: ${agent.id}`}
                >
                  {agent.name}
                </DropdownItem>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Interface for agent information from Parlant server
 */
interface Agent {
  id: string;
  name: string;
  description?: string;
  max_engine_iterations?: number;
  composition_mode?: string;
  tags?: string[];
}

/**
 * Props for the ConfigurationModal component
 */
interface ConfigurationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Current server URL */
  serverUrl: string;
  /** Function to update server URL */
  onServerUrlChange: (url: string) => void;
  /** Current agent ID */
  agentId: string;
  /** Function to update agent ID */
  onAgentIdChange: (id: string) => void;
  /** Current customer ID */
  customerId: string;
  /** Function to update customer ID */
  onCustomerIdChange: (id: string) => void;
  /** Current selected token */
  selectedToken: string | null;
  /** Function to handle token selection */
  onTokenSelect: (tokenId: string) => void;
  /** Available agents */
  availableAgents: Agent[];
  /** Whether agents are loading */
  isLoadingAgents: boolean;
  /** Agent error message */
  agentError: string;
  /** Function to fetch agents */
  onFetchAgents: () => void;
  /** Function to start chat (optional, for main config) */
  onStartChat?: () => void;
  /** Whether the start chat button should be shown */
  showStartButton?: boolean;
  /** Whether chat is currently active */
  isChatActive?: boolean;
  /** Welcome messages per language */
  welcomeMessages: Record<'da' | 'en', string>;
  /** Function to update welcome messages */
  onWelcomeMessagesChange: (messages: Record<'da' | 'en', string>) => void;
  /** Current language setting */
  language: 'da' | 'en';
  /** Function to update language */
  onLanguageChange: (language: 'da' | 'en') => void;
  /** Current initial mode setting */
  initialMode: 'popup' | 'fullscreen' | 'minimized';
  /** Function to update initial mode */
  onInitialModeChange: (mode: 'popup' | 'fullscreen' | 'minimized') => void;
  /** Current auto start session setting */
  autoStartSession: boolean;
  /** Function to update auto start session */
  onAutoStartSessionChange: (enabled: boolean) => void;
}

/**
 * Reusable configuration modal component
 */
export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  serverUrl,
  onServerUrlChange,
  agentId,
  onAgentIdChange,
  selectedToken,
  onTokenSelect,
  availableAgents,
  isLoadingAgents,
  agentError,
  onFetchAgents,
  onStartChat,
  isChatActive = false,
  welcomeMessages,
  onWelcomeMessagesChange,
  language,
  onLanguageChange,
  initialMode,
  onInitialModeChange,
  autoStartSession,
  onAutoStartSessionChange
}) => {
  // JWT Tokens configuration
  const tokens = [
    {
      id: 'john',
      name: 'John Doe',
      customerId: '1234567890',
      token: 'ewogICJhbGciOiAiSFMyNTYiLAogICJ0eXAiOiAiSldUIgp9.ewogICJzdWIiOiAiMTIzNDU2Nzg5MCIsCiAgIm5hbWUiOiAiSm9obiBEb2UiLAogICJpYXQiOiAxNzU4NjQ4MTEzCn0.1tACoQ8N__nyDDogsW6gXX_KKTLFQk6xhgau0ITyT8o'
    },
    {
      id: 'jane',
      name: 'Jane Doe',
      customerId: '0987654321',
      token: 'ewogICJhbGciOiAiSFMyNTYiLAogICJ0eXAiOiAiSldUIgp9.ewogICJzdWIiOiAiMDk4NzY1NDMyMSIsCiAgIm5hbWUiOiAiSmFuZSBEb2UiLAogICJpYXQiOiAxNzU4NjQ4MTEzCn0.EHvtqwgp-DCWJcU1jcE93ztqFFhKl7f7i7Jgb1SLOS4'
    }
  ];

  // Combobox state for server URL
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const serverInputRef = useRef<HTMLInputElement>(null);
  const serverDropdownRef = useRef<HTMLDivElement>(null);
  
  // State for which language tab is active in welcome message editor
  const [editingWelcomeLanguage, setEditingWelcomeLanguage] = useState<'da' | 'en'>(language);
  
  // State for active config tab
  const [activeTab, setActiveTab] = useState<ConfigTab>('connection');

  // Compute completed steps
  const completedSteps = new Set<ConfigTab>();
  
  // Connection is complete when server URL is set, agent is selected, and no errors
  if (serverUrl.trim() && agentId.trim() && !agentError) {
    completedSteps.add('connection');
  }
  
  // Auth is complete when a token is selected
  if (selectedToken) {
    completedSteps.add('auth');
  }
  
  // Chat is always considered complete (optional settings)
  completedSteps.add('chat');
  
  // Appearance is always considered complete (optional settings)
  completedSteps.add('appearance');
  
  // Update editing language when main language changes
  useEffect(() => {
    setEditingWelcomeLanguage(language);
  }, [language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        serverInputRef.current &&
        serverDropdownRef.current &&
        !serverInputRef.current.contains(event.target as Node) &&
        !serverDropdownRef.current.contains(event.target as Node)
      ) {
        setShowServerDropdown(false);
      }
    };

    if (showServerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showServerDropdown]);

  // Handle server URL selection from dropdown
  const handleServerSelect = (url: string) => {
    onServerUrlChange(url);
    setShowServerDropdown(false);
  };

  // Get current theme to check if purple theme is active
  const { themePreset, effectiveMode } = useTheme();
  const isPurpleDark = themePreset === 'purple' && effectiveMode === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-[9999]" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {/* Background overlay - purple gradient for purple theme in dark mode, semi-transparent black for others */}
      {isPurpleDark ? (
        <>
          {/* Purple gradient overlays matching the main page */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(270,65%,10%)] via-[hsl(270,60%,25%)] to-[hsl(270,65%,10%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(270,80%,35%),hsl(270,50%,15%)_70%)]"></div>
          {/* Semi-transparent overlay for modal backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      )}
      <div className="bg-card rounded-lg border border-border shadow-2xl max-w-lg w-full mx-2 sm:mx-4 h-[min(600px,calc(100dvh-2rem))] overflow-hidden relative z-10 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 sm:px-5 pt-4 pb-0 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-card-foreground">Settings</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Step Progress Indicator */}
          <div className="mb-4">
            <StepProgress
              steps={configSteps}
              completedSteps={completedSteps}
              activeTab={activeTab}
              onStepClick={setActiveTab}
            />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors relative',
                  activeTab === tab.id
                    ? 'text-primary bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content - fixed height scrollable area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 min-h-0">
          {/* Connection Tab */}
          {activeTab === 'connection' && (
          <div className="space-y-5">
            {/* Server URL Combobox */}
            <div className="space-y-2">
              <label htmlFor="serverUrl" className="block text-sm font-medium text-foreground">
                Server
              </label>
              <div className="relative">
              <div className={cn(
                "relative bg-background rounded-md",
                showServerDropdown && "z-[100]"
              )}>
                <input
                  ref={serverInputRef}
                  id="serverUrl"
                  type="text"
                  value={serverUrl}
                  onChange={(e) => onServerUrlChange(e.target.value)}
                  onFocus={() => setShowServerDropdown(true)}
                  onPaste={() => {
                    // Allow paste to work normally, then show dropdown
                    setTimeout(() => setShowServerDropdown(true), 0);
                  }}
                  className="w-full px-4 pr-10 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 text-sm"
                  placeholder="Enter server URL or select..."
                />
                <button
                  type="button"
                  onClick={() => setShowServerDropdown(!showServerDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle server list"
                >
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${showServerDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
              {showServerDropdown && (
                <>
                  {/* Backdrop with blur */}
                  <div 
                    className="fixed inset-0 z-[99] bg-black/5 backdrop-blur-[2px]" 
                    onClick={() => setShowServerDropdown(false)}
                  />
                  <div
                    ref={serverDropdownRef}
                    className="absolute z-[100] w-full mt-2 bg-popover border border-border rounded-md shadow-2xl overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-border/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Server size={12} />
                        <span>Available Servers</span>
                      </div>
                    </div>
                    <div className="p-1.5 max-h-60 overflow-auto">
                      {Object.entries(SERVER_CONFIG).map(([url, config]) => (
                        <DropdownItem
                          key={url}
                          selected={serverUrl === url}
                          onClick={() => handleServerSelect(url)}
                          description={url}
                        >
                          {config.name}
                        </DropdownItem>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Error Message */}
            {agentError && (
              <div className="mt-3 p-3 bg-destructive text-destructive-foreground border border-destructive rounded-lg">
                <p className="text-sm">{agentError}</p>
              </div>
            )}
          </div>

            {/* Agent Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="agentId" className="block text-sm font-medium text-foreground">
                  Agent
                </label>
                <button
                  onClick={onFetchAgents}
                  disabled={isLoadingAgents || !serverUrl.trim() || !!agentError}
                  className="text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors flex items-center gap-1.5"
                  title="Refresh agents"
                >
                  <RefreshCw size={14} className={isLoadingAgents ? 'animate-spin' : ''} />
                  <span className="text-xs font-medium">Refresh</span>
                </button>
              </div>

              <AgentDropdown
                agents={availableAgents}
                selectedAgentId={agentId}
                onSelect={onAgentIdChange}
                isLoading={isLoadingAgents}
                hasError={!!agentError}
              />

              {isLoadingAgents && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Loading agents from server...</span>
                </p>
              )}
            </div>
          </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
          <div className="space-y-5">
            {/* Welcome Message per Language */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Welcome Message
              </label>
              {/* Language Tabs */}
              <div className="flex border-b border-border">
                {(['da', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setEditingWelcomeLanguage(lang)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium transition-colors relative',
                      editingWelcomeLanguage === lang
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {lang === 'da' ? 'Dansk' : 'English'}
                    {editingWelcomeLanguage === lang && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>
              {/* Message Input for Selected Language */}
              <textarea
                id="welcomeMessage"
                value={welcomeMessages[editingWelcomeLanguage]}
                onChange={(e) => {
                  onWelcomeMessagesChange({
                    ...welcomeMessages,
                    [editingWelcomeLanguage]: e.target.value
                  });
                }}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 text-sm resize-y"
                placeholder={`Enter welcome message for ${editingWelcomeLanguage === 'da' ? 'Danish' : 'English'}...`}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{customerName}'} and {'{agentName}'} as placeholders.
              </p>
            </div>

            {/* Language & Display Mode - Side by Side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Language
                </label>
                <SimpleDropdown
                  icon={<Globe size={12} />}
                  label="Language"
                  options={[
                    { value: 'en', label: 'English', description: 'English' },
                    { value: 'da', label: 'Dansk', description: 'Danish' },
                  ]}
                  value={language}
                  onChange={(value) => onLanguageChange(value as 'da' | 'en')}
                />
              </div>

              {/* Initial Mode Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Display Mode
                </label>
                <SimpleDropdown
                  icon={<Monitor size={12} />}
                  label="Display Mode"
                  options={[
                    { value: 'popup', label: 'Popup', description: 'Floating' },
                    { value: 'fullscreen', label: 'Fullscreen', description: 'Full' },
                    { value: 'minimized', label: 'Minimized', description: 'Collapsed' },
                  ]}
                  value={initialMode}
                  onChange={(value) => onInitialModeChange(value as 'popup' | 'fullscreen' | 'minimized')}
                />
              </div>
            </div>

            {/* Auto Start Session Toggle */}
            <button
              type="button"
              onClick={() => onAutoStartSessionChange(!autoStartSession)}
              className="w-full flex items-center justify-between gap-4 p-4 rounded-md border border-border hover:border-primary/30 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-sm font-medium text-foreground">Auto Start Session</span>
                <span className="text-xs text-muted-foreground">Create session automatically when chat opens</span>
              </div>
              <div 
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0',
                  autoStartSession ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200',
                    autoStartSession ? 'left-6' : 'left-1'
                  )}
                />
              </div>
            </button>
          </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
          <div className="space-y-5">
            {/* Light/Dark Mode Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Mode
              </label>
              <ModeToggle />
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Color Theme
              </label>
              <ThemeSelector variant="buttons" size="sm" />
            </div>
          </div>
          )}

          {/* Auth Tab */}
          {activeTab === 'auth' && (
          <div className="space-y-5">
            {/* Token Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Select User
              </label>
            <div className="space-y-2">
              {tokens.map((token) => {
                const isSelected = selectedToken === token.token;
                return (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => onTokenSelect(token.id)}
                    className={cn(
                      'w-full border rounded-md p-4 cursor-pointer transition-all text-left group',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                      )}>
                        {token.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}>
                          {token.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: {token.customerId}
                        </p>
                      </div>
                      
                      {/* Check indicator */}
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground/30 group-hover:border-primary/50'
                      )}>
                        {isSelected && <Check size={12} className="text-primary-foreground" />}
                      </div>
                    </div>
                    
                    {/* Token preview when selected */}
                    {isSelected && (
                      <div className="mt-3 p-2 bg-background/50 rounded-lg border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Token</p>
                        <p className="text-xs font-mono text-foreground/80 break-all leading-relaxed">
                          {token.token.substring(0, 50)}...
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
              {selectedToken && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                  <span>Authentication active</span>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Footer with Action Button */}
        <div className="flex-shrink-0 bg-card border-t border-border px-4 sm:px-5 py-4">
          {onStartChat ? (
            <button
              onClick={() => {
                log('ConfigurationModal button clicked:', {
                  isChatActive,
                  serverUrl: serverUrl.trim(),
                  agentId: agentId.trim(),
                  selectedToken,
                  agentError,
                  buttonDisabled: !serverUrl.trim() || !agentId.trim() || !selectedToken || !!agentError,
                  onStartChatType: typeof onStartChat
                });
                onStartChat();
              }}
              disabled={!serverUrl.trim() || !agentId.trim() || !selectedToken || !!agentError}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-md transition-all duration-200 text-sm"
            >
              {isChatActive ? 'Apply Changes' : 'Start Chat'}
            </button>
          ) : (
            <div className="w-full p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-center text-sm">
              No onStartChat function provided
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
