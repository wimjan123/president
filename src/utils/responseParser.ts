import type { PersonaLLMResponse, ReactionType } from '../types'

const VALID_REACTIONS: ReactionType[] = ['comment', 'like', 'angry', 'laugh', 'share', 'ignore']

export function parseBatchedPersonaResponse(
  content: string,
  expectedPersonaIds: string[]
): Map<string, PersonaLLMResponse> {
  const results = new Map<string, PersonaLLMResponse>()

  try {
    // Try to extract JSON - handle both object wrapper and direct array
    let responses: any[] = []

    // Try parsing as JSON array first
    const arrayMatch = content.match(/\[[\s\S]*\]/)
    const objectMatch = content.match(/\{[\s\S]*\}/)

    if (arrayMatch) {
      try {
        responses = JSON.parse(arrayMatch[0])
      } catch {
        // Not a direct array, try object wrapper
      }
    }

    if (responses.length === 0 && objectMatch) {
      const parsed = JSON.parse(objectMatch[0])
      responses = parsed.responses || [parsed]
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

      const reaction: ReactionType = VALID_REACTIONS.includes(resp.reaction)
        ? resp.reaction
        : 'comment'
      let sentimentShift = Number(resp.sentimentShift || resp.sentiment_shift || resp.sentiment) || 0
      sentimentShift = Math.max(-10, Math.min(10, sentimentShift))
      const comment = (reaction === 'comment' && (resp.comment || resp.text || resp.message))
        ? String(resp.comment || resp.text || resp.message).slice(0, 280)
        : null

      results.set(personaId, { reaction, comment, sentimentShift })
    }

    // Debug logging
    console.log('Parsed batched responses:', results.size, 'of', expectedPersonaIds.length)

  } catch (error) {
    console.warn('Failed to parse batched persona response:', error)
    console.warn('Raw content:', content.substring(0, 500))
  }

  return results
}

export function parsePersonaResponse(content: string): PersonaLLMResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate reaction type
      const reaction: ReactionType = VALID_REACTIONS.includes(parsed.reaction)
        ? parsed.reaction
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
      headline: String(parsed.headline).slice(0, 100),
      description: String(parsed.description).slice(0, 300),
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
        content: content.trim().slice(0, 280),
        issueTags: [],
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      content: String(parsed.content || content).slice(0, 280),
      issueTags: Array.isArray(parsed.issueTags)
        ? parsed.issueTags.map(String).slice(0, 3)
        : [],
    }
  } catch {
    return {
      content: content.trim().slice(0, 280),
      issueTags: [],
    }
  }
}
