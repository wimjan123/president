import type { PersonaLLMResponse, ReactionType } from '../types'

const VALID_REACTIONS: ReactionType[] = ['comment', 'like', 'angry', 'laugh', 'share', 'ignore']

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
