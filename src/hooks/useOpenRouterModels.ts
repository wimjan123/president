import { useState, useEffect, useCallback } from 'react'
import type { OpenRouterModel } from '../types'

interface UseOpenRouterModelsReturn {
  models: OpenRouterModel[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOpenRouterModels(): UseOpenRouterModelsReturn {
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Models endpoint is public, no auth needed
      const response = await fetch('https://openrouter.ai/api/v1/models')

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const allModels = data.data as OpenRouterModel[]

      // Sort by name
      allModels.sort((a, b) => a.name.localeCompare(b.name))

      setModels(allModels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
      setModels([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return { models, loading, error, refetch: fetchModels }
}
