import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

interface SettingsState extends Settings {
  setApiKey: (key: string) => void
  setSelectedModel: (model: string) => void
  setMockMode: (enabled: boolean) => void
  setTickSpeed: (ms: number) => void
  // Rival customization
  setRivalName: (name: string) => void
  setRivalHandle: (handle: string) => void
  // Game timing
  setNewsMinInterval: (seconds: number) => void
  setNewsMaxInterval: (seconds: number) => void
  setRivalMinInterval: (seconds: number) => void
  setRivalMaxInterval: (seconds: number) => void
  // Difficulty
  setMinResponders: (count: number) => void
  setMaxResponders: (count: number) => void
  setResponseSpeedMultiplier: (multiplier: number) => void
  hasValidApiKey: () => boolean
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  selectedModel: 'anthropic/claude-sonnet-4-20250514',
  mockMode: false,
  tickSpeed: 1000,
  // Rival customization
  rivalName: 'Senator Patricia Morgan',
  rivalHandle: '@SenMorgan',
  // Game timing (in seconds)
  newsMinInterval: 60,
  newsMaxInterval: 90,
  rivalMinInterval: 90,
  rivalMaxInterval: 120,
  // Difficulty
  minResponders: 5,
  maxResponders: 10,
  responseSpeedMultiplier: 1.0,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setApiKey: (key) => set({ apiKey: key.trim() }),

      setSelectedModel: (model) => set({ selectedModel: model }),

      setMockMode: (enabled) => set({ mockMode: enabled }),

      setTickSpeed: (ms) => set({ tickSpeed: Math.max(200, Math.min(5000, ms)) }),

      // Rival customization
      setRivalName: (name) => set({ rivalName: name.trim() || 'Senator Patricia Morgan' }),
      setRivalHandle: (handle) => {
        const cleaned = handle.trim()
        set({ rivalHandle: cleaned.startsWith('@') ? cleaned : `@${cleaned}` })
      },

      // Game timing (clamp to valid ranges)
      setNewsMinInterval: (seconds) => set({ newsMinInterval: Math.max(30, Math.min(180, seconds)) }),
      setNewsMaxInterval: (seconds) => set({ newsMaxInterval: Math.max(30, Math.min(180, seconds)) }),
      setRivalMinInterval: (seconds) => set({ rivalMinInterval: Math.max(60, Math.min(240, seconds)) }),
      setRivalMaxInterval: (seconds) => set({ rivalMaxInterval: Math.max(60, Math.min(240, seconds)) }),

      // Difficulty
      setMinResponders: (count) => set({ minResponders: Math.max(1, Math.min(15, count)) }),
      setMaxResponders: (count) => set({ maxResponders: Math.max(1, Math.min(15, count)) }),
      setResponseSpeedMultiplier: (multiplier) => set({ responseSpeedMultiplier: Math.max(0.5, Math.min(2.0, multiplier)) }),

      hasValidApiKey: () => {
        const { apiKey } = get()
        return apiKey.length > 20
      },
    }),
    {
      name: 'president-game-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        mockMode: state.mockMode,
        tickSpeed: state.tickSpeed,
        rivalName: state.rivalName,
        rivalHandle: state.rivalHandle,
        newsMinInterval: state.newsMinInterval,
        newsMaxInterval: state.newsMaxInterval,
        rivalMinInterval: state.rivalMinInterval,
        rivalMaxInterval: state.rivalMaxInterval,
        minResponders: state.minResponders,
        maxResponders: state.maxResponders,
        responseSpeedMultiplier: state.responseSpeedMultiplier,
      }),
    }
  )
)
