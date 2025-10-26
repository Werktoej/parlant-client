import React from 'react';
import { X, RefreshCw, ChevronDown } from 'lucide-react';
import { SERVER_CONFIG } from '../config/serverConfig';
import { log } from '../Chat/utils/logger';

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
  isChatActive = false
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

  // Get selected agent details
  const selectedAgent = availableAgents.find(agent => agent.id === agentId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl max-w-md w-full mx-2 sm:mx-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Chat Configuration</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Server URL Dropdown */}
          <div>
            <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Parlant Server
            </label>
            <select
              id="serverUrl"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer text-base bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ffffff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27/%3e%3c/svg%3e')] bg-[length:20px] bg-[right_0.75rem_center] bg-no-repeat"
            >
              {Object.entries(SERVER_CONFIG).map(([url, config]) => (
                <option key={url} value={url} className="bg-gray-800 text-white">
                  {config.name} ({url})
                </option>
              ))}
            </select>
          </div>

          {/* Agent Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="agentId" className="block text-sm font-medium text-gray-300">
                Agent
              </label>
              <button
                onClick={onFetchAgents}
                disabled={isLoadingAgents || !serverUrl.trim()}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors flex items-center space-x-1"
                title="Refresh agents"
              >
                <RefreshCw size={16} className={isLoadingAgents ? 'animate-spin' : ''} />
                <span className="text-xs">Refresh</span>
              </button>
            </div>

            {agentError && (
              <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{agentError}</p>
              </div>
            )}

            {availableAgents.length > 0 ? (
              <div className="relative">
                <select
                  id="agentId"
                  value={agentId}
                  onChange={(e) => onAgentIdChange(e.target.value)}
                  className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base appearance-none cursor-pointer"
                >
                  <option value="">Select an agent...</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            ) : (
              <input
                id="agentId"
                type="text"
                value={agentId}
                onChange={(e) => onAgentIdChange(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                placeholder="Enter agent ID manually..."
              />
            )}

            {isLoadingAgents && (
              <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                <RefreshCw size={12} className="animate-spin" />
                <span>Loading agents from server...</span>
              </p>
            )}
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select User
            </label>
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedToken === token.token
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                    }`}
                  onClick={() => onTokenSelect(token.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{token.name}</p>
                      <p className="text-sm text-gray-400">Customer ID: {token.customerId}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${selectedToken === token.token
                      ? 'border-blue-400 bg-blue-400'
                      : 'border-gray-500'
                      }`}>
                      {selectedToken === token.token && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                  {selectedToken === token.token && (
                    <div className="mt-2 p-2 bg-blue-500/10 rounded text-xs font-mono text-blue-300 break-all">
                      {token.token.substring(0, 60)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedToken && (
              <p className="text-xs text-green-400 mt-2 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Authentication token selected
              </p>
            )}
          </div>

          {/* Action Button */}
          {onStartChat ? (
            <button
              onClick={() => {
                log('ConfigurationModal button clicked:', {
                  isChatActive,
                  serverUrl: serverUrl.trim(),
                  agentId: agentId.trim(),
                  selectedToken,
                  buttonDisabled: !serverUrl.trim() || !agentId.trim() || !selectedToken,
                  onStartChatType: typeof onStartChat
                });
                onStartChat();
              }}
              disabled={!serverUrl.trim() || !agentId.trim() || !selectedToken}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl text-base"
            >
              {isChatActive ? 'Apply Changes' : 'Start Chat'}
            </button>
          ) : (
            <div className="w-full p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
              No onStartChat function provided
            </div>
          )}

          {/* Agent Info */}
          {selectedAgent && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-300">Selected Agent</p>
                <span className="text-xs text-gray-400 font-mono">{selectedAgent.id}</span>
              </div>
              <p className="text-sm text-white font-medium">{selectedAgent.name}</p>
              {selectedAgent.composition_mode && (
                <p className="text-xs text-gray-400">
                  Mode: {selectedAgent.composition_mode} • Max iterations: {selectedAgent.max_engine_iterations}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
