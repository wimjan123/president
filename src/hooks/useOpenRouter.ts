import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import { useGameStore } from '../stores/gameStore'
import type { LLMRequest, LLMResponse } from '../types'
import { getMockResponse } from '../utils/mockResponses'

interface QueueItem {
  request: LLMRequest
  resolve: (response: LLMResponse<string>) => void
  reject: (error: Error) => void
}

const MAX_CONCURRENT_CALLS = 3
const CALL_TIMEOUT_MS = 30000

export function useOpenRouter() {
  const { apiKey, selectedModel, mockMode } = useSettingsStore()
  const { incrementPendingResponses, decrementPendingResponses, addToast } = useUIStore()
  const { addTokenUsage } = useGameStore()

  const queueRef = useRef<QueueItem[]>([])
  const activeCallsRef = useRef<number>(0)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  const executeCallRef = useRef<(request: LLMRequest) => Promise<LLMResponse<string>>>()

  const processQueue = useCallback(async () => {
    while (queueRef.current.length > 0 && activeCallsRef.current < MAX_CONCURRENT_CALLS) {
      const item = queueRef.current.shift()
      if (!item) break

      activeCallsRef.current++
      incrementPendingResponses()

      try {
        // Use ref to always get latest executeCall with current apiKey
        const response = await executeCallRef.current!(item.request)
        item.resolve(response)
      } catch (error) {
        item.reject(error as Error)
      } finally {
        activeCallsRef.current--
        decrementPendingResponses()
        processQueue()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const executeCall = useCallback(
    async (request: LLMRequest): Promise<LLMResponse<string>> => {
      // Mock mode - return fake response
      if (mockMode) {
        return getMockResponse(request)
      }

      // Check API key before making call
      if (!apiKey || apiKey.length < 10) {
        return {
          requestId: request.id,
          success: false,
          error: 'No API key configured. Go to Settings to add your OpenRouter API key.',
        }
      }

      // Real API call
      const controller = new AbortController()
      abortControllersRef.current.set(request.id, controller)

      const timeoutId = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS)

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Election Campaign Simulator',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: request.prompt }],
            temperature: 0.8,
            max_tokens: 2000,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key. Check your OpenRouter API key in Settings.')
          }
          if (response.status === 402) {
            throw new Error('Insufficient credits. Add credits to your OpenRouter account.')
          }
          if (response.status === 429) {
            throw new Error('Rate limited. Please wait a moment.')
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
          throw new Error('Empty response from API')
        }

        // Track usage
        const tokensUsed = data.usage?.total_tokens || 0
        const costEstimate = estimateCost(data.usage, selectedModel)
        addTokenUsage(tokensUsed, costEstimate)

        // Return raw content - let callers parse based on request type
        return {
          requestId: request.id,
          success: true,
          data: content,
          tokensUsed,
          costEstimate,
        }
      } catch (error) {
        clearTimeout(timeoutId)

        // Retry once on failure
        if (request.retryCount < 1) {
          return executeCall({ ...request, retryCount: request.retryCount + 1 })
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        addToast({
          type: 'error',
          message: `API call failed: ${errorMessage}`,
          duration: 5000,
        })

        return {
          requestId: request.id,
          success: false,
          error: errorMessage,
        }
      } finally {
        abortControllersRef.current.delete(request.id)
      }
    },
    [apiKey, selectedModel, mockMode, addTokenUsage, addToast]
  )

  // Keep ref updated so processQueue always uses latest executeCall
  executeCallRef.current = executeCall

  const queueRequest = useCallback(
    (
      request: Omit<LLMRequest, 'id' | 'retryCount' | 'createdAt'>
    ): Promise<LLMResponse<string>> => {
      return new Promise((resolve, reject) => {
        const fullRequest: LLMRequest = {
          ...request,
          id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          retryCount: 0,
          createdAt: Date.now(),
        }

        queueRef.current.push({
          request: fullRequest,
          resolve: resolve as (response: LLMResponse<string>) => void,
          reject,
        })

        processQueue()
      })
    },
    [processQueue]
  )

  const cancelAllPending = useCallback(() => {
    queueRef.current = []
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()
  }, [])

  const getQueueStatus = useCallback(() => {
    return {
      queued: queueRef.current.length,
      active: activeCallsRef.current,
    }
  }, [])

  return {
    queueRequest,
    cancelAllPending,
    getQueueStatus,
  }
}

function estimateCost(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  model: string
): number {
  if (!usage) return 0

  // Cost per million tokens (approximate)
  const costs: Record<string, { input: number; output: number }> = {
    'anthropic/claude-sonnet-4-20250514': { input: 3, output: 15 },
    'anthropic/claude-opus-4-20250514': { input: 15, output: 75 },
    'openai/gpt-4o': { input: 5, output: 15 },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.9, output: 0.9 },
  }

  const modelCost = costs[model] || { input: 1, output: 3 }

  return (
    ((usage.prompt_tokens || 0) / 1_000_000) * modelCost.input +
    ((usage.completion_tokens || 0) / 1_000_000) * modelCost.output
  )
}
