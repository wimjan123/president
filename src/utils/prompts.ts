import type { Persona, PlayerData, Post, RivalData, Issue } from '../types'
import { describePoliticalLeaning, describeOpinion, ISSUE_LABELS } from '../types'

export function buildPersonaResponsePrompt(
  persona: Persona,
  post: Post,
  player: PlayerData
): string {
  const leaningDesc = describePoliticalLeaning(persona.politicalLeaning)
  const opinionDesc = describeOpinion(persona.opinionOfPlayer)
  const issueNames = persona.priorityIssues.map((i) => ISSUE_LABELS[i]).join(', ')
  const traits = persona.personalityTraits.join(', ')

  const voiceNotes = []
  if (persona.vocabularyLevel === 'simple') voiceNotes.push('uses simple, everyday language')
  if (persona.vocabularyLevel === 'sophisticated') voiceNotes.push('uses educated, nuanced vocabulary')
  if (persona.formality === 'casual') voiceNotes.push('writes casually, like texting')
  if (persona.formality === 'formal') voiceNotes.push('writes formally and properly')
  if (persona.usesSlang) voiceNotes.push('uses slang and abbreviations')
  if (persona.usesEmoji) voiceNotes.push('uses emojis occasionally')

  const exampleSection =
    persona.examplePosts.length > 0
      ? `\nExamples of how you write:\n${persona.examplePosts.map((p) => `- "${p}"`).join('\n')}`
      : ''

  const catchphraseNote =
    persona.catchphrases.length > 0
      ? `\nYou often use phrases like: ${persona.catchphrases.map((p) => `"${p}"`).join(', ')}`
      : ''

  return `You are simulating a social media user responding to a political post. Stay completely in character. Respond naturally as this person would - be authentic to their personality, not performative.

Your character:
- Name: ${persona.name}, ${persona.age} age group
- Occupation: ${persona.occupation} from ${persona.location}
- Political leaning: ${leaningDesc}
- Issues you care most about: ${issueNames}
- Personality: ${traits}
- How you write: ${voiceNotes.join('; ')}
- Current opinion of this candidate: ${opinionDesc}${catchphraseNote}${exampleSection}

The candidate (${player.candidateName}, ${player.party}) just posted:
"${post.content}"
${post.issueTags.length > 0 ? `Topics tagged: ${post.issueTags.map((i) => ISSUE_LABELS[i]).join(', ')}` : ''}

Respond as ${persona.name} would. Your response must be:
- A reaction type: one of "comment", "like", "angry", "laugh", "share", or "ignore"
- If comment: the actual comment text (1-3 sentences, casual social media style)
- A sentiment score from -10 to +10 indicating how this interaction affected your opinion of the candidate

Respond ONLY with this exact JSON format:
{
  "reaction": "comment",
  "comment": "your comment text here",
  "sentimentShift": 3
}

If your reaction is not "comment", set comment to null.`
}

export function buildBatchedPersonaResponsePrompt(
  personas: Persona[],
  post: Post,
  player: PlayerData
): string {
  const personaDescriptions = personas.map((persona, index) => {
    const leaningDesc = describePoliticalLeaning(persona.politicalLeaning)
    const opinionDesc = describeOpinion(persona.opinionOfPlayer)
    const issueNames = persona.priorityIssues.map((i) => ISSUE_LABELS[i]).join(', ')
    const traits = persona.personalityTraits.join(', ')

    const voiceNotes = []
    if (persona.vocabularyLevel === 'simple') voiceNotes.push('uses simple language')
    if (persona.vocabularyLevel === 'sophisticated') voiceNotes.push('uses educated vocabulary')
    if (persona.formality === 'casual') voiceNotes.push('writes casually')
    if (persona.formality === 'formal') voiceNotes.push('writes formally')
    if (persona.usesSlang) voiceNotes.push('uses slang')
    if (persona.usesEmoji) voiceNotes.push('uses emojis')

    const exampleSection = persona.examplePosts.length > 0
      ? `\n  Examples: ${persona.examplePosts.map(p => `"${p}"`).join(', ')}`
      : ''

    return `[PERSONA ${index + 1}: ${persona.id}]
Name: ${persona.name}, ${persona.age}
${persona.occupation} from ${persona.location}
Political: ${leaningDesc} | Opinion of candidate: ${opinionDesc}
Cares about: ${issueNames}
Personality: ${traits}
Voice: ${voiceNotes.join('; ')}${exampleSection}`
  }).join('\n\n')

  const issueTags = post.issueTags.length > 0
    ? `Topics: ${post.issueTags.map(i => ISSUE_LABELS[i]).join(', ')}`
    : ''

  return `Simulate ${personas.length} distinct social media users responding to a political post.

THE POST by ${player.candidateName} (${player.party}):
"${post.content}"
${issueTags}

PERSONAS:
${personaDescriptions}

RESPONSE REQUIREMENTS:
1. Each persona MUST respond differently based on their unique profile
2. Vary comment LENGTH: simple vocabulary = shorter (1 sentence), sophisticated = longer (2-3 sentences)
3. Vary TONE: conservatives sound different from liberals, skeptics from optimists
4. Match their VOICE: casual personas use contractions/slang, formal ones don't
5. Consider their OPINION: negative opinion = critical/dismissive, positive = supportive
6. Some personas should NOT comment (use "like", "angry", "share", or "ignore" instead)

BAD EXAMPLE (all sound the same):
- Maya: "This is a great policy idea!"
- Jerome: "This is a wonderful initiative!"
- Betty: "This is an excellent proposal!"

GOOD EXAMPLE (distinct voices):
- Maya (grad student, liberal, uses emoji): "finally someone gets it!! climate action NOW"
- Jerome (union worker, skeptical): "Talk is cheap. What's the actual plan here?"
- Betty (retiree, formal, conservative): "I remain unconvinced. Where is the fiscal responsibility?"

Return JSON:
{
  "responses": [
    {"personaId": "id", "reaction": "comment|like|angry|laugh|share|ignore", "comment": "text matching their voice or null", "sentimentShift": -10 to +10},
    ...
  ]
}

Include ALL ${personas.length} personas. Each response must be unmistakably from that specific persona.`
}

export function buildNewsGenerationPrompt(
  player: PlayerData,
  rival: RivalData,
  playerFavorability: number,
  rivalFavorability: number,
  recentPosts: Post[],
  hotIssues: Issue[]
): string {
  const recentPlayerPosts = recentPosts
    .filter((p) => p.type === 'player')
    .slice(0, 3)
    .map((p) => `"${p.content}"`)
    .join('\n')

  const recentRivalPosts = recentPosts
    .filter((p) => p.type === 'rival')
    .slice(0, 3)
    .map((p) => `"${p.content}"`)
    .join('\n')

  const hotIssueNames = hotIssues.map((i) => ISSUE_LABELS[i]).join(', ')

  return `You are a news headline generator for a presidential campaign simulation. Generate realistic, politically neutral news that affects the campaign.

Current game state:
- Player: ${player.candidateName} (${player.party}), ${playerFavorability}% favorability
- Rival: ${rival.name} (${rival.party}), ${rivalFavorability}% favorability

Recent player posts:
${recentPlayerPosts || 'None yet'}

Recent rival posts:
${recentRivalPosts || 'None yet'}

Hot issues: ${hotIssueNames || 'Various'}

Generate a news headline and brief description (2-3 sentences). The news should:
- Sometimes be about the candidates directly (based on their recent posts)
- Sometimes be external events that affect certain issues
- Feel realistic and timely
- Be politically neutral (not favor either candidate)

Respond in this exact JSON format:
{
  "headline": "Breaking: Short headline here",
  "description": "2-3 sentence description of the news event.",
  "affectedIssues": ["economy", "healthcare"],
  "issueImpact": {"economy": 5, "healthcare": -3}
}

Issue impact numbers range from -10 to +10, indicating how the news affects public attention on that issue.`
}

export function buildRivalPostPrompt(
  player: PlayerData,
  rival: RivalData,
  playerFavorability: number,
  rivalFavorability: number,
  recentPlayerPosts: Post[],
  recentNews: string[]
): string {
  const playerPostsSummary = recentPlayerPosts
    .slice(0, 3)
    .map((p) => `"${p.content}"`)
    .join('\n')

  const newsContext = recentNews.length > 0 ? recentNews.join('; ') : 'No recent news'

  const behindAhead =
    rivalFavorability > playerFavorability
      ? 'currently leading in polls'
      : rivalFavorability < playerFavorability
        ? 'currently trailing in polls'
        : 'tied in polls'

  return `You are simulating ${rival.name}, a ${rival.party} presidential candidate. Generate a social media post for their campaign.

Character profile:
- Name: ${rival.name}
- Party: ${rival.party}
- Style: Calculated, polished, occasionally attacks opponents
- Currently: ${behindAhead}

Opponent (${player.candidateName}, ${player.party}) recent posts:
${playerPostsSummary || 'None yet'}

Recent news: ${newsContext}

Generate a campaign post that:
- Sounds like a professional politician
- May respond to recent news
- May attack or contrast with the opponent
- Should feel authentic to a ${rival.party} candidate
- Be 1-2 sentences, social media style

Respond in this exact JSON format:
{
  "content": "Your campaign post here",
  "issueTags": ["economy", "healthcare"]
}

Include 1-3 relevant issue tags.`
}
