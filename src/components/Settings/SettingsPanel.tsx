import { useState, useMemo } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUIStore } from '../../stores/uiStore'
import { useGameStore } from '../../stores/gameStore'
import { useOpenRouterModels } from '../../hooks/useOpenRouterModels'

export function SettingsPanel() {
  const {
    apiKey,
    selectedModel,
    mockMode,
    rivalName,
    rivalHandle,
    newsMinInterval,
    newsMaxInterval,
    rivalMinInterval,
    rivalMaxInterval,
    minResponders,
    maxResponders,
    responseSpeedMultiplier,
    setApiKey,
    setSelectedModel,
    setMockMode,
    setRivalName,
    setRivalHandle,
    setNewsMinInterval,
    setNewsMaxInterval,
    setRivalMinInterval,
    setRivalMaxInterval,
    setMinResponders,
    setMaxResponders,
    setResponseSpeedMultiplier,
    hasValidApiKey,
  } = useSettingsStore()

  const { closeModal, addToast } = useUIStore()
  const { resetGame } = useGameStore()
  const { models, loading: modelsLoading, error: modelsError, refetch } = useOpenRouterModels()

  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models
    const search = modelSearch.toLowerCase()
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.id.toLowerCase().includes(search)
    )
  }, [models, modelSearch])

  // Format pricing for display
  const formatPricing = (prompt: string, completion: string): string => {
    const promptPrice = parseFloat(prompt) * 1000000
    const completionPrice = parseFloat(completion) * 1000000
    if (promptPrice === 0 && completionPrice === 0) return 'Free'
    return `$${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per 1M tokens`
  }

  // Get current model info
  const currentModel = models.find((m) => m.id === selectedModel)

  const handleTestConnection = async () => {
    if (!apiKey) {
      addToast({ type: 'warning', message: 'Please enter an API key first', duration: 3000 })
      return
    }

    setTestingConnection(true)

    try {
      // Use the auth/key endpoint to validate the API key
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const credits = data.data?.limit_remaining
        const message = credits !== undefined
          ? `API key valid! Credits: $${(credits / 100).toFixed(2)}`
          : 'API key valid!'
        addToast({ type: 'success', message, duration: 3000 })
      } else if (response.status === 401) {
        addToast({
          type: 'error',
          message: 'Invalid API key',
          duration: 5000,
        })
      } else {
        addToast({
          type: 'error',
          message: `API error: ${response.status} ${response.statusText}`,
          duration: 5000,
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to connect. Check your network.',
        duration: 5000,
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? All progress will be lost.')) {
      resetGame()
      closeModal()
      addToast({ type: 'info', message: 'Game reset successfully', duration: 3000 })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Settings</h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* OpenRouter API Key */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-2">
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !apiKey}
                className="btn-secondary whitespace-nowrap"
              >
                {testingConnection ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-player hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
            {hasValidApiKey() && (
              <p className="text-xs text-[var(--success)] mt-1">API key configured</p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-2">
              AI Model
            </label>

            {/* Current selection display */}
            {currentModel && (
              <div className="mb-2 px-3 py-2 bg-overlay rounded-lg border border-white/10">
                <div className="text-sm text-[var(--text-primary)] font-medium">{currentModel.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {formatPricing(currentModel.pricing.prompt, currentModel.pricing.completion)}
                </div>
              </div>
            )}

            {/* Search input */}
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search models..."
              className="input mb-2"
            />

            {/* Model list */}
            {modelsLoading ? (
              <div className="text-sm text-[var(--text-muted)] py-4 text-center">
                Loading models...
              </div>
            ) : modelsError ? (
              <div className="text-sm text-rival py-2">
                {modelsError}
                <button onClick={refetch} className="ml-2 text-player hover:underline">
                  Retry
                </button>
              </div>
            ) : models.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)] py-4 text-center">
                No models available.{' '}
                <button onClick={refetch} className="text-player hover:underline">
                  Retry
                </button>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg">
                {filteredModels.length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)] py-4 text-center">
                    No models match your search
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setModelSearch('')
                      }}
                      className={`w-full text-left px-3 py-2 border-b border-white/[0.03] last:border-b-0 transition-colors ${
                        model.id === selectedModel
                          ? 'bg-player/10 text-player'
                          : 'hover:bg-overlay text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{model.name}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {formatPricing(model.pricing.prompt, model.pricing.completion)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)] mt-2">
              {models.length > 0 && `${models.length} models available`}
            </p>
          </div>

          {/* Mock Mode */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-display font-medium text-[var(--text-secondary)]">
                  Mock Mode
                </label>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Use template responses instead of API calls
                </p>
              </div>
              <button
                onClick={() => setMockMode(!mockMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  mockMode ? 'bg-gold' : 'bg-overlay'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    mockMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Rival Character Section */}
          <div>
            <h3 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
              Rival Character
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">
                  Opponent Name
                </label>
                <input
                  type="text"
                  value={rivalName}
                  onChange={(e) => setRivalName(e.target.value)}
                  placeholder="Senator Patricia Morgan"
                  className="input"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">
                  Opponent Handle
                </label>
                <input
                  type="text"
                  value={rivalHandle}
                  onChange={(e) => setRivalHandle(e.target.value)}
                  placeholder="@SenMorgan"
                  className="input"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Game Timing Section */}
          <div>
            <h3 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
              Game Timing
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">News Frequency</span>
                  <span className="text-[var(--text-primary)] font-mono">{newsMinInterval}-{newsMaxInterval}s</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-[var(--text-muted)]">Min</span>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    value={newsMinInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setNewsMinInterval(val)
                      if (val > newsMaxInterval) setNewsMaxInterval(val)
                    }}
                    className="flex-1 accent-cyan"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Max</span>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    value={newsMaxInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setNewsMaxInterval(val)
                      if (val < newsMinInterval) setNewsMinInterval(val)
                    }}
                    className="flex-1 accent-cyan"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Rival Post Frequency</span>
                  <span className="text-[var(--text-primary)] font-mono">{rivalMinInterval}-{rivalMaxInterval}s</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-[var(--text-muted)]">Min</span>
                  <input
                    type="range"
                    min={60}
                    max={240}
                    value={rivalMinInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setRivalMinInterval(val)
                      if (val > rivalMaxInterval) setRivalMaxInterval(val)
                    }}
                    className="flex-1 accent-rival"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Max</span>
                  <input
                    type="range"
                    min={60}
                    max={240}
                    value={rivalMaxInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setRivalMaxInterval(val)
                      if (val < rivalMinInterval) setRivalMinInterval(val)
                    }}
                    className="flex-1 accent-rival"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Difficulty Section */}
          <div>
            <h3 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
              Difficulty
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Responders per Post</span>
                  <span className="text-[var(--text-primary)] font-mono">{minResponders}-{maxResponders}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-[var(--text-muted)]">Min</span>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={minResponders}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setMinResponders(val)
                      if (val > maxResponders) setMaxResponders(val)
                    }}
                    className="flex-1 accent-gold"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Max</span>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={maxResponders}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setMaxResponders(val)
                      if (val < minResponders) setMinResponders(val)
                    }}
                    className="flex-1 accent-gold"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Response Speed</span>
                  <span className="text-[var(--text-primary)] font-mono">
                    {responseSpeedMultiplier < 0.8 ? 'Fast' : responseSpeedMultiplier > 1.2 ? 'Slow' : 'Normal'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={responseSpeedMultiplier}
                  onChange={(e) => setResponseSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-gold"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Reset Game */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-2">
              Game Data
            </label>
            <button
              onClick={handleResetGame}
              className="px-4 py-2 bg-rival/10 border border-rival/30 text-rival rounded-lg hover:bg-rival/20 transition-colors"
            >
              Reset Game
            </button>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Clear all game progress and start over
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06]">
          <button onClick={closeModal} className="w-full btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
