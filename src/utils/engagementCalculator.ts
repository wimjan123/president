import type { Persona, Post, Issue, EngagementType } from '../types'

// Deterministic hash function for reproducible engagement
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Calculate engagement type for a single persona (deterministic - no LLM)
export function calculatePersonaEngagement(
  persona: Persona,
  post: Post,
  playerPosition: number
): EngagementType {
  // Deterministic seed from persona + post
  const seed = hashCode(`${persona.id}-${post.id}`)
  const threshold = (seed % 100) - 50 // -50 to +49

  // Calculate political distance (0-200 normalized to 0-100)
  const politicalDistance = Math.abs(persona.politicalLeaning - playerPosition)

  // Calculate topic overlap (0 to 1)
  const topicOverlap = post.issueTags.length > 0
    ? post.issueTags.filter((tag) =>
        persona.priorityIssues.includes(tag as Issue)
      ).length / post.issueTags.length
    : 0.3 // Neutral if no tags

  // Calculate alignment score (-100 to +100 range approximately)
  const alignmentScore =
    (50 - politicalDistance / 2) * 0.3 +   // Political alignment (max +50)
    (topicOverlap * 100 - 50) * 0.3 +      // Topic relevance (max +50)
    persona.opinionOfPlayer * 0.4          // Current opinion (-100 to +100)

  // Deterministic engagement based on score vs threshold
  if (alignmentScore > threshold + 25) return 'like'
  if (alignmentScore > threshold + 10 && topicOverlap > 0.3) return 'retweet'
  if (alignmentScore < threshold - 25) return 'dislike'
  return 'none'
}

// Calculate engagement from all personas except those who will comment
export function calculateAllEngagement(
  personas: Map<string, Persona>,
  respondingPersonaIds: string[], // Exclude these - they're commenting
  post: Post,
  playerPosition: number
): { likes: string[]; retweets: string[]; dislikes: string[] } {
  const likes: string[] = []
  const retweets: string[] = []
  const dislikes: string[] = []

  personas.forEach((persona, id) => {
    // Skip personas who are responding with comments
    if (respondingPersonaIds.includes(id)) return

    const engagement = calculatePersonaEngagement(persona, post, playerPosition)
    if (engagement === 'like') likes.push(id)
    else if (engagement === 'retweet') retweets.push(id)
    else if (engagement === 'dislike') dislikes.push(id)
  })

  return { likes, retweets, dislikes }
}

// Scale engagement to realistic numbers using segment sizes
export function scaleEngagement(
  personaIds: string[],
  personas: Map<string, Persona>,
  viralMultiplier: number = 1.0
): number {
  if (personaIds.length === 0) return 0

  // Sum up segment sizes of engaged personas
  const baseCount = personaIds.reduce((sum, id) => {
    const persona = personas.get(id)
    return sum + (persona?.segmentSize || 100000)
  }, 0)

  // Apply viral multiplier and engagement rate (1-3% of segment actually engages)
  const engagementRate = 0.01 + Math.random() * 0.02
  return Math.round(baseCount * viralMultiplier * engagementRate)
}

// Format large numbers for display (e.g., 1.2K, 3.5M)
export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}
