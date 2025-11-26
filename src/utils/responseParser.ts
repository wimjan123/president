import type { PersonaLLMResponse, ReactionType, PostImpact } from '../types'

const VALID_REACTIONS: ReactionType[] = ['comment', 'like', 'angry', 'laugh', 'retweet', 'ignore']

// Default post impact when not provided by LLM
const DEFAULT_POST_IMPACT: PostImpact = {
  viralPotential: 20,
  followerTrend: 'stable',
  estimatedFollowerDelta: 0,
}

function parsePostImpact(raw: any): PostImpact {
  if (!raw || typeof raw !== 'object') return DEFAULT_POST_IMPACT

  const viralPotential = Math.max(0, Math.min(100, Number(raw.viralPotential) || 20))
  const validTrends = ['gaining', 'losing', 'stable'] as const
  const followerTrend = validTrends.includes(raw.followerTrend) ? raw.followerTrend : 'stable'
  const estimatedFollowerDelta = Math.max(-10000, Math.min(50000, Number(raw.estimatedFollowerDelta) || 0))

  return { viralPotential, followerTrend, estimatedFollowerDelta }
}

export interface BatchedResponseResult {
  responses: Map<string, PersonaLLMResponse>
  postImpact: PostImpact
}

export function parseBatchedPersonaResponse(
  content: string,
  expectedPersonaIds: string[]
): BatchedResponseResult {
  const results = new Map<string, PersonaLLMResponse>()
  let postImpact = DEFAULT_POST_IMPACT

  try {
    let responses: any[] = []

    // Try parsing as complete object FIRST (preferred format with postImpact)
    const objectMatch = content.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0])
        // Check if it has responses array (wrapper format)
        if (parsed.responses && Array.isArray(parsed.responses)) {
          responses = parsed.responses
          // Extract postImpact from wrapper
          if (parsed.postImpact) {
            postImpact = parsePostImpact(parsed.postImpact)
          }
        } else if (parsed.reaction) {
          // Single response object
          responses = [parsed]
        }
      } catch {
        // Object parse failed, try array fallback
      }
    }

    // Fallback to direct array if no responses found yet
    if (responses.length === 0) {
      const arrayMatch = content.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          responses = JSON.parse(arrayMatch[0])
        } catch {
          // Array parse also failed
        }
      }
    }

    // Process responses - try to match by personaId or by position
    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i]

      // Try to find matching personaId
      let personaId = resp.personaId || resp.persona_id || resp.id

      // If no personaId or not in expected list, use position-based matching
      if (!personaId || !expectedPersonaIds.includes(personaId)) {
        if (i < expectedPersonaIds.length) {
          personaId = expectedPersonaIds[i]
        } else {
          continue
        }
      }

      // Handle 'share' as legacy alias for 'retweet'
      let rawReaction = resp.reaction
      if (rawReaction === 'share') rawReaction = 'retweet'

      const reaction: ReactionType = VALID_REACTIONS.includes(rawReaction)
        ? rawReaction
        : 'comment'
      let sentimentShift = Number(resp.sentimentShift || resp.sentiment_shift || resp.sentiment) || 0
      sentimentShift = Math.max(-10, Math.min(10, sentimentShift))
      const comment = (reaction === 'comment' && (resp.comment || resp.text || resp.message))
        ? String(resp.comment || resp.text || resp.message).slice(0, 280)
        : null

      results.set(personaId, { reaction, comment, sentimentShift })
    }

    // Debug logging
    console.log('Parsed batched responses:', results.size, 'of', expectedPersonaIds.length, 'postImpact:', postImpact)

  } catch (error) {
    console.warn('Failed to parse batched persona response:', error)
    console.warn('Raw content:', content.substring(0, 500))
  }

  return { responses: results, postImpact }
}

export function parsePersonaResponse(content: string): PersonaLLMResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Handle 'share' as legacy alias for 'retweet'
      let rawReaction = parsed.reaction
      if (rawReaction === 'share') rawReaction = 'retweet'

      // Validate reaction type
      const reaction: ReactionType = VALID_REACTIONS.includes(rawReaction)
        ? rawReaction
        : 'comment'

      // Validate sentiment shift (-10 to +10)
      let sentimentShift = Number(parsed.sentimentShift) || 0
      sentimentShift = Math.max(-10, Math.min(10, sentimentShift))

      // Get comment if present
      const comment =
        reaction === 'comment' && parsed.comment
          ? String(parsed.comment).slice(0, 280)
          : null

      return {
        reaction,
        comment,
        sentimentShift,
      }
    }

    // Fallback: treat entire content as a comment
    return {
      reaction: 'comment',
      comment: content.trim().slice(0, 280),
      sentimentShift: 0,
    }
  } catch {
    // JSON parse failed - use content as comment
    return {
      reaction: 'comment',
      comment: content.trim().slice(0, 280),
      sentimentShift: 0,
    }
  }
}

export function parseNewsResponse(content: string): {
  headline: string
  description: string
  affectedIssues: string[]
} | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.headline || !parsed.description) return null

    return {
      headline: String(parsed.headline).slice(0, 200),
      description: String(parsed.description).slice(0, 500),
      affectedIssues: Array.isArray(parsed.affectedIssues)
        ? parsed.affectedIssues.map(String).slice(0, 3)
        : [],
    }
  } catch {
    return null
  }
}

export function parseRivalResponse(content: string): {
  content: string
  issueTags: string[]
} | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Use raw content as post
      return {
        content: content.trim().slice(0, 500),
        issueTags: [],
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      content: String(parsed.content || content).slice(0, 500),
      issueTags: Array.isArray(parsed.issueTags)
        ? parsed.issueTags.map(String).slice(0, 3)
        : [],
    }
  } catch {
    return {
      content: content.trim().slice(0, 500),
      issueTags: [],
    }
  }
}
