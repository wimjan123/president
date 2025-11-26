import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { OpenRouterModel } from '../types'

interface UseOpenRouterModelsReturn {
  models: OpenRouterModel[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOpenRouterModels(): UseOpenRouterModelsReturn {
  const { apiKey } = useSettingsStore()
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      setModels([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Filter to only text generation models (exclude image/audio)
      const textModels = (data.data as OpenRouterModel[]).filter((model) => {
        // Check architecture for modality
        if (model.architecture?.modality) {
          return model.architecture.modality === 'text->text' ||
                 model.architecture.modality === 'text+image->text'
        }
        // If no architecture info, check if it's not explicitly an image/audio model
        const id = model.id.toLowerCase()
        return !id.includes('image') &&
               !id.includes('dall-e') &&
               !id.includes('stable-diffusion') &&
               !id.includes('whisper') &&
               !id.includes('tts')
      })

      // Sort by name
      textModels.sort((a, b) => a.name.localeCompare(b.name))

      setModels(textModels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
      setModels([])
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  // Fetch when apiKey changes
  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return { models, loading, error, refetch: fetchModels }
}
