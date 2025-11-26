import type { LLMRequest, LLMResponse, ReactionType } from '../types'

interface MockTemplate {
  reaction: ReactionType
  comment: string | null
  sentimentShift: number
}

const MOCK_TEMPLATES: MockTemplate[] = [
  // Positive reactions
  {
    reaction: 'comment',
    comment: 'Finally someone speaking sense! This is exactly what we need.',
    sentimentShift: 7,
  },
  {
    reaction: 'comment',
    comment: 'I have to admit, this makes a lot of sense. Cautiously optimistic.',
    sentimentShift: 4,
  },
  {
    reaction: 'like',
    comment: null,
    sentimentShift: 2,
  },
  {
    reaction: 'share',
    comment: null,
    sentimentShift: 5,
  },
  {
    reaction: 'comment',
    comment: 'This is what real leadership looks like. Keep it up!',
    sentimentShift: 6,
  },
  {
    reaction: 'comment',
    comment: 'About time someone addressed this issue. You have my attention.',
    sentimentShift: 3,
  },

  // Neutral reactions
  {
    reaction: 'comment',
    comment: 'Interesting perspective. Would like to see more details on implementation.',
    sentimentShift: 1,
  },
  {
    reaction: 'comment',
    comment: 'Not sure I fully agree, but at least its a concrete proposal.',
    sentimentShift: 0,
  },
  {
    reaction: 'comment',
    comment: 'Show me the plan, not just the talking points. How are you going to do this?',
    sentimentShift: -1,
  },
  {
    reaction: 'ignore',
    comment: null,
    sentimentShift: 0,
  },

  // Negative reactions
  {
    reaction: 'comment',
    comment: 'Same old political promises. Wake me up when something actually changes.',
    sentimentShift: -4,
  },
  {
    reaction: 'angry',
    comment: null,
    sentimentShift: -3,
  },
  {
    reaction: 'comment',
    comment: 'Hard disagree. This completely ignores the real issues facing working families.',
    sentimentShift: -6,
  },
  {
    reaction: 'comment',
    comment: 'Another day, another politician trying to buy votes with empty promises.',
    sentimentShift: -5,
  },
  {
    reaction: 'laugh',
    comment: null,
    sentimentShift: -2,
  },
  {
    reaction: 'comment',
    comment: 'This is out of touch with reality. Do you actually talk to regular people?',
    sentimentShift: -7,
  },

  // Mixed/nuanced reactions
  {
    reaction: 'comment',
    comment: 'I like the idea but Im skeptical about execution. Politicians always overpromise.',
    sentimentShift: 1,
  },
  {
    reaction: 'comment',
    comment: 'Better than what the other side is offering, Ill give you that.',
    sentimentShift: 2,
  },
  {
    reaction: 'comment',
    comment: 'The numbers dont add up. How are you funding this?',
    sentimentShift: -2,
  },
  {
    reaction: 'comment',
    comment: 'My family has been dealing with this issue for years. Good to see someone talking about it.',
    sentimentShift: 5,
  },
]

// Mock news headlines
const MOCK_NEWS = [
  { headline: 'Economic Report Shows Mixed Results', description: 'New data reveals both opportunities and challenges ahead.', issues: ['economy'] },
  { headline: 'Healthcare Costs Continue to Rise', description: 'Families across the nation feel the squeeze.', issues: ['healthcare'] },
  { headline: 'Climate Summit Produces New Agreements', description: 'World leaders commit to emission targets.', issues: ['climate'] },
  { headline: 'Immigration Reform Debate Heats Up', description: 'Both sides dig in on key provisions.', issues: ['immigration'] },
]

// Mock rival posts
const MOCK_RIVAL_POSTS = [
  { content: 'My opponent talks a big game, but where are the results? Americans deserve better.', issues: ['economy'] },
  { content: 'While others make empty promises, I have a real plan for working families.', issues: ['economy', 'healthcare'] },
  { content: 'Leadership means making tough decisions, not just popular ones.', issues: [] },
  { content: 'The choice is clear: experience and results, or more of the same failed policies.', issues: [] },
]

export async function getMockResponse(request: LLMRequest): Promise<LLMResponse<string>> {
  // Simulate network delay (800-2500ms)
  const delay = 800 + Math.random() * 1700
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Small chance of "failure" for realism (3%)
  if (Math.random() < 0.03) {
    return {
      requestId: request.id,
      success: false,
      error: 'Mock API timeout (simulated)',
    }
  }

  // Return different mock data based on request type
  if (request.type === 'news_generation') {
    const news = MOCK_NEWS[Math.floor(Math.random() * MOCK_NEWS.length)]
    return {
      requestId: request.id,
      success: true,
      data: JSON.stringify({
        headline: news.headline,
        description: news.description,
        affectedIssues: news.issues,
      }),
      tokensUsed: 100,
      costEstimate: 0.0001,
    }
  }

  if (request.type === 'rival_post') {
    const post = MOCK_RIVAL_POSTS[Math.floor(Math.random() * MOCK_RIVAL_POSTS.length)]
    return {
      requestId: request.id,
      success: true,
      data: JSON.stringify({
        content: post.content,
        issueTags: post.issues,
      }),
      tokensUsed: 100,
      costEstimate: 0.0001,
    }
  }

  // Default: persona response
  const template = MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)]
  const variation = (Math.random() - 0.5) * 4
  const adjustedSentiment = Math.round(
    Math.max(-10, Math.min(10, template.sentimentShift + variation))
  )

  return {
    requestId: request.id,
    success: true,
    data: JSON.stringify({
      reaction: template.reaction,
      comment: template.comment,
      sentimentShift: adjustedSentiment,
    }),
    tokensUsed: 100 + Math.floor(Math.random() * 150),
    costEstimate: 0.0001,
  }
}
