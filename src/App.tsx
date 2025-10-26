import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { ParlantChatBot } from './Chat'
import { ConfigurationModal } from './components/ConfigurationModal'
import { ChatErrorBoundary } from './components/ErrorBoundary'
import { getDefaultServerUrl } from './config/serverConfig'
import { getEnvConfig, validateEnvConfig } from './config/envConfig'
import { log, logError } from './Chat/utils/logger'

/**
 * Interface for agent information from Parlant server
 */
interface Agent {
  id: string
  name: string
  description?: string
  max_engine_iterations?: number
  composition_mode?: string
  tags?: string[]
}

/**
 * Main App component demonstrating ParlantChatBot integration
 * Features configuration panel with agent fetching
 */
function App() {
  // Load environment configuration
  const envConfig = getEnvConfig()

  // Validate environment variables on mount
  useEffect(() => {
    validateEnvConfig()
  }, [])

  const [showSettings, setShowSettings] = useState<boolean>(true)
  const [serverUrl, setServerUrl] = useState<string>(envConfig.serverUrl || getDefaultServerUrl())
  const [agentId, setAgentId] = useState<string>(envConfig.agentId || '')
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(false)
  const [agentError, setAgentError] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(false)

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

  /**
   * Fetches available agents from the Parlant server
   */
  const fetchAgents = async (): Promise<void> => {
    if (!serverUrl.trim()) return

    setIsLoadingAgents(true)
    setAgentError('')

    try {
      const headers: Record<string, string> = {};
      if (selectedToken) {
        headers['Authorization'] = `Bearer ${selectedToken}`;
      }

      const response = await fetch(`${serverUrl}/agents`, {
        method: 'GET',
        headers
      })
      if (response.ok) {
        const agents: Agent[] = await response.json()
        setAvailableAgents(agents)

        // If we have agents and no current selection, use the first one
        if (agents.length > 0 && !agentId) {
          setAgentId(agents[0].id)
        }

        log('Fetched agents:', agents)
      } else {
        const errorText = `Failed to fetch agents: ${response.status} ${response.statusText}`
        setAgentError(errorText)
        logError(errorText)
      }
    } catch (error) {
      const errorMessage = `Error connecting to server: ${error instanceof Error ? error.message : 'Unknown error'}`
      setAgentError(errorMessage)
      logError('Error fetching agents:', error)
    } finally {
      setIsLoadingAgents(false)
    }
  }

  /**
   * Handles the activation of the chatbot
   */
  const handleStartChat = (): void => {
    if (serverUrl.trim() && agentId.trim()) {
      setIsChatEnabled(true)
      setShowSettings(false)
    }
  }

  /**
   * Toggles the settings panel visibility
   */
  const toggleSettings = (): void => {
    setShowSettings(!showSettings)
  }

  /**
   * Handles server URL change
   */
  const handleServerUrlChange = (url: string): void => {
    setServerUrl(url)
    setAgentError('')
  }

  /**
   * Handles token selection and sets customer ID
   */
  const handleTokenSelect = (tokenId: string): void => {
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      setSelectedToken(token.token);
      setCustomerId(token.customerId);
      setCustomerName(token.name);

      // Store token in localStorage for future API calls
      localStorage.setItem('parlant_auth_token', token.token);
      localStorage.setItem('parlant_customer_id', token.customerId);
      localStorage.setItem('parlant_customer_name', token.name);

      log('Token selected:', {
        user: token.name,
        customerId: token.customerId,
        token: token.token.substring(0, 50) + '...'
      });
    }
  }

  /**
   * Handles when chat is closed
   */
  const handleChatClose = (): void => {
    log('Chat was closed/minimized')
  }

  /**
   * Handles when a session is created
   */
  const handleSessionCreated = (sessionId: string): void => {
    log('Session created:', sessionId)
  }

  // Fetch agents when component mounts or server URL changes
  useEffect(() => {
    if (serverUrl.trim()) {
      fetchAgents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl])

  // Get selected agent details
  const selectedAgent = availableAgents.find(agent => agent.id === agentId)

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto px-2">
          <div className="space-y-2 sm:space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              {selectedAgent?.name || envConfig.agentName}
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-white/80">
              Chat Experience
            </h2>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            Experience intelligent conversations with our advanced AI chatbot.
            Configure your settings and start chatting instantly.
          </p>

          {!isChatEnabled && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 sm:mt-12">
              <button
                onClick={toggleSettings}
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
                <span>Configure Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={showSettings}
        onClose={toggleSettings}
        serverUrl={serverUrl}
        onServerUrlChange={handleServerUrlChange}
        agentId={agentId}
        onAgentIdChange={setAgentId}
        customerId={customerId}
        onCustomerIdChange={setCustomerId}
        selectedToken={selectedToken}
        onTokenSelect={handleTokenSelect}
        availableAgents={availableAgents}
        isLoadingAgents={isLoadingAgents}
        agentError={agentError}
        onFetchAgents={fetchAgents}
        onStartChat={handleStartChat}
        showStartButton={true}
        isChatActive={isChatEnabled}
      />

      {/* ParlantChatBot Component with Error Boundary */}
      {isChatEnabled && serverUrl && agentId && (
        <ChatErrorBoundary>
          <ParlantChatBot
            serverUrl={serverUrl}
            agentId={agentId}
            agentName={selectedAgent?.name || envConfig.agentName}
            authToken={selectedToken || undefined}
            customerId={customerId}
            customerName={customerName}
            language={envConfig.language}
            initialMode={envConfig.initialMode}
            onSessionCreated={handleSessionCreated}
            onClose={handleChatClose}
            autoStartSession={envConfig.autoStartSession}
            enableLogging={envConfig.enableLogging}
            pollingConfig={envConfig.pollingConfig}
            showAttribution={envConfig.showAttribution}
          />
        </ChatErrorBoundary>
      )}

      {/* Settings Toggle (when chat is active) */}
      {isChatEnabled && (
        <button
          onClick={toggleSettings}
          className="fixed right-4 sm:right-8 bg-white/10 backdrop-blur-lg border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl z-40"
          style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
        >
          <Settings size={20} />
        </button>
      )}
    </div>
  )
}

export default App