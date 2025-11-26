import { useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useOpenRouter } from './useOpenRouter'
import { buildPersonaResponsePrompt } from '../utils/prompts'
import { parsePersonaResponse } from '../utils/responseParser'
import type { Persona, Post, PostReaction, Issue } from '../types'

interface PersonaSelectionConfig {
  minResponders: number
  maxResponders: number
}

const DEFAULT_CONFIG: PersonaSelectionConfig = {
  minResponders: 5,
  maxResponders: 10,
}

export function usePersonaResponses() {
  const { personas, player, loop, addReactionToPost, updatePersonaOpinion, setPersonaLastResponse, setPostProcessing } =
    useGameStore()
  const { queueRequest } = useOpenRouter()

  // Calculate how relevant a post is to a persona based on issue overlap
  const calculateTopicRelevance = useCallback((persona: Persona, post: Post): number => {
    if (post.issueTags.length === 0) return 0.5 // Neutral if no tags

    const overlap = post.issueTags.filter((tag) =>
      persona.priorityIssues.includes(tag as Issue)
    ).length

    return overlap / post.issueTags.length
  }, [])

  // Calculate fatigue based on recent responses
  const calculateFatigue = useCallback(
    (persona: Persona): number => {
      const ticksSinceLastResponse = loop.currentTick - persona.lastResponseTick
      if (ticksSinceLastResponse > 60) return 0 // No fatigue after 60 ticks
      if (ticksSinceLastResponse < 10) return 0.8 // High fatigue if very recent
      return Math.max(0, 1 - ticksSinceLastResponse / 60)
    },
    [loop.currentTick]
  )

  // Select which personas will respond to a post
  const selectRespondingPersonas = useCallback(
    (post: Post, config: PersonaSelectionConfig = DEFAULT_CONFIG): Persona[] => {
      const personaArray = Array.from(personas.values())

      // Calculate response probability for each persona
      const withProbability = personaArray.map((persona) => {
        let probability = persona.engagementLikelihood

        // Topic relevance is crucial
        const topicRelevance = calculateTopicRelevance(persona, post)
        probability *= 0.4 + topicRelevance * 0.6

        // Extreme opinions (positive or negative) increase engagement
        const opinionStrength = Math.abs(persona.opinionOfPlayer) / 100
        probability += opinionStrength * 0.25

        // Fatigue reduces likelihood
        const fatigue = calculateFatigue(persona)
        probability *= 1 - fatigue * 0.5

        // Political alignment with content affects engagement
        // Controversial posts (topic + opposing views) get more engagement
        if (post.type === 'player' && player) {
          const alignmentDiff = Math.abs(persona.politicalLeaning - player.politicalPosition)
          // Both aligned AND opposed people engage more than neutrals
          if (alignmentDiff > 50 || alignmentDiff < 20) {
            probability += 0.1
          }
        }

        return {
          persona,
          probability: Math.min(0.95, Math.max(0.05, probability)),
        }
      })

      // Sort by probability
      withProbability.sort((a, b) => b.probability - a.probability)

      // Select personas based on probability
      const selected: Persona[] = []
      const targetCount = config.minResponders + Math.floor(Math.random() * (config.maxResponders - config.minResponders + 1))

      for (const item of withProbability) {
        if (selected.length >= targetCount) break
        // Random check against probability
        if (Math.random() < item.probability) {
          selected.push(item.persona)
        }
      }

      // Ensure minimum responders
      if (selected.length < config.minResponders) {
        const remaining = withProbability
          .filter((item) => !selected.includes(item.persona))
          .slice(0, config.minResponders - selected.length)

        remaining.forEach((item) => selected.push(item.persona))
      }

      return selected
    },
    [personas, player, calculateTopicRelevance, calculateFatigue]
  )

  // Calculate display delay based on wave and randomness
  const calculateDisplayDelay = useCallback(
    (persona: Persona, index: number): number => {
      // Wave timing:
      // Wave 1 (0-5s): responseWave === 1
      // Wave 2 (5-20s): responseWave === 2
      // Wave 3 (20-45s): responseWave === 3

      let baseDelay: number
      let variance: number

      switch (persona.responseWave) {
        case 1:
          baseDelay = 0
          variance = 5
          break
        case 2:
          baseDelay = 5
          variance = 15
          break
        case 3:
        default:
          baseDelay = 20
          variance = 25
          break
      }

      // Add random variance
      const randomOffset = Math.random() * variance

      // Add small index-based offset to prevent clumping
      const indexOffset = index * 0.5

      return Math.round(baseDelay + randomOffset + indexOffset)
    },
    []
  )

  // Generate responses for a post
  const generateResponses = useCallback(
    async (post: Post) => {
      if (!player) return

      // Select responding personas
      const respondingPersonas = selectRespondingPersonas(post)

      // Queue LLM calls for each persona
      const responsePromises = respondingPersonas.map(async (persona, index) => {
        try {
          const prompt = buildPersonaResponsePrompt(persona, post, player)

          const response = await queueRequest({
            prompt,
            personaId: persona.id,
            type: 'persona_response',
          })

          if (response.success && response.data) {
            // Parse raw content into PersonaLLMResponse
            const data = parsePersonaResponse(response.data)

            // Calculate display delay
            const displayDelay = calculateDisplayDelay(persona, index)
            const displayTick = loop.currentTick + displayDelay

            // Create reaction
            const reaction: PostReaction = {
              personaId: persona.id,
              reactionType: data.reaction,
              comment: data.comment,
              sentimentShift: data.sentimentShift,
              displayedAt: displayTick,
              isDisplayed: false,
            }

            // Add reaction to post
            addReactionToPost(post.id, reaction)

            // Update persona opinion
            updatePersonaOpinion(persona.id, data.sentimentShift)

            // Mark last response time
            setPersonaLastResponse(persona.id, loop.currentTick)
          }
        } catch (error) {
          console.error(`Failed to get response from ${persona.name}:`, error)
        }
      })

      await Promise.allSettled(responsePromises)

      // Mark post as no longer processing
      setPostProcessing(post.id, false)
    },
    [
      player,
      selectRespondingPersonas,
      queueRequest,
      calculateDisplayDelay,
      loop.currentTick,
      addReactionToPost,
      updatePersonaOpinion,
      setPersonaLastResponse,
      setPostProcessing,
    ]
  )

  return {
    generateResponses,
    selectRespondingPersonas,
  }
}
