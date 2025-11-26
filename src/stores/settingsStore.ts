import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

interface SettingsState extends Settings {
  setApiKey: (key: string) => void
  setSelectedModel: (model: string) => void
  setMockMode: (enabled: boolean) => void
  setTickSpeed: (ms: number) => void
  hasValidApiKey: () => boolean
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  selectedModel: 'anthropic/claude-sonnet-4-20250514',
  mockMode: false,
  tickSpeed: 1000,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setApiKey: (key) => set({ apiKey: key.trim() }),

      setSelectedModel: (model) => set({ selectedModel: model }),

      setMockMode: (enabled) => set({ mockMode: enabled }),

      setTickSpeed: (ms) => set({ tickSpeed: Math.max(200, Math.min(5000, ms)) }),

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
      }),
    }
  )
)
