// === ISSUE TYPES ===
export type Issue =
  | 'economy'
  | 'healthcare'
  | 'immigration'
  | 'climate'
  | 'education'
  | 'crime'
  | 'foreign_policy'
  | 'gun_rights'
  | 'abortion'
  | 'taxes'

export const ISSUES: Issue[] = [
  'economy',
  'healthcare',
  'immigration',
  'climate',
  'education',
  'crime',
  'foreign_policy',
  'gun_rights',
  'abortion',
  'taxes',
]

export const ISSUE_LABELS: Record<Issue, string> = {
  economy: 'Economy',
  healthcare: 'Healthcare',
  immigration: 'Immigration',
  climate: 'Climate',
  education: 'Education',
  crime: 'Crime',
  foreign_policy: 'Foreign Policy',
  gun_rights: 'Gun Rights',
  abortion: 'Abortion',
  taxes: 'Taxes',
}

// === PERSONA TYPES ===
export type AgeGroup = '18-29' | '30-44' | '45-64' | '65+'

export type PersonalityTrait =
  | 'skeptical'
  | 'optimistic'
  | 'passionate'
  | 'pragmatic'
  | 'confrontational'
  | 'thoughtful'
  | 'sarcastic'
  | 'earnest'
  | 'cynical'
  | 'idealistic'

export type VocabularyLevel = 'simple' | 'moderate' | 'sophisticated'
export type Formality = 'casual' | 'balanced' | 'formal'
export type ResponseWave = 1 | 2 | 3

export interface Persona {
  id: string
  name: string
  handle: string
  age: AgeGroup
  occupation: string
  location: string
  politicalLeaning: number // -100 (far left) to +100 (far right)
  priorityIssues: [Issue, Issue, Issue]
  personalityTraits: PersonalityTrait[]
  engagementLikelihood: number // 0.0 to 1.0
  opinionOfPlayer: number // -100 to +100
  opinionOfRival: number // -100 to +100
  avatarSeed: string
  // Voice characteristics for LLM prompting
  vocabularyLevel: VocabularyLevel
  formality: Formality
  usesSlang: boolean
  usesEmoji: boolean
  catchphrases: string[]
  examplePosts: string[]
  // Response behavior
  responseWave: ResponseWave
  lastResponseTick: number
}

// === PLAYER TYPES ===
export type Party = 'Democrat' | 'Republican' | 'Independent' | string

export interface PlayerData {
  candidateName: string
  party: Party
  politicalPosition: number // -100 to +100
  priorityIssues: [Issue, Issue, Issue]
}

// === RIVAL TYPES ===
export interface RivalData {
  name: string
  party: Party
  politicalPosition: number
  handle: string
  avatarSeed: string
}

// === POST TYPES ===
export type PostType = 'player' | 'rival' | 'news'

export type ReactionType = 'comment' | 'like' | 'angry' | 'laugh' | 'share' | 'ignore'

export interface PostReaction {
  personaId: string
  reactionType: ReactionType
  comment: string | null
  sentimentShift: number
  displayedAt: number // tick when displayed
  isDisplayed: boolean
}

export interface Post {
  id: string
  type: PostType
  author: {
    name: string
    handle: string
    avatarSeed: string
  }
  content: string
  issueTags: Issue[]
  timestamp: number // game tick
  reactions: PostReaction[]
  isProcessing: boolean
}

// === NEWS TYPES ===
export interface NewsItem {
  id: string
  headline: string
  description: string
  affectedIssues: Issue[]
  issueImpact: Partial<Record<Issue, number>>
  timestamp: number
}

// === GAME LOOP TYPES ===
export interface ScheduledEvent {
  id: string
  type: 'news' | 'rival_post'
  triggerTick: number
  completed: boolean
}

export interface GameLoopState {
  currentTick: number
  lastTickTime: number
  scheduledEvents: ScheduledEvent[]
}

// === SETTINGS TYPES ===
export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  pricing: {
    prompt: string
    completion: string
  }
  context_length: number
  architecture?: {
    modality: string
    input_modalities?: string[]
    output_modalities?: string[]
  }
}

export interface Settings {
  apiKey: string
  selectedModel: string
  mockMode: boolean
  tickSpeed: number // ms per tick
}

// === UI STATE TYPES ===
export type ModalType = 'settings' | 'persona_detail' | 'help' | null

export interface Toast {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  duration: number
}

export interface UIState {
  isPaused: boolean
  activeModal: ModalType
  selectedPersonaId: string | null
  pendingResponses: number
  toasts: Toast[]
}

// === API TYPES ===
export interface LLMRequest {
  id: string
  prompt: string
  personaId?: string
  type: 'persona_response' | 'news_generation' | 'rival_post'
  retryCount: number
  createdAt: number
}

export interface PersonaLLMResponse {
  reaction: ReactionType
  comment: string | null
  sentimentShift: number
}

export interface NewsLLMResponse {
  headline: string
  description: string
  affectedIssues: Issue[]
  issueImpact: Partial<Record<Issue, number>>
}

export interface RivalLLMResponse {
  content: string
  issueTags: Issue[]
}

export interface LLMResponse<T = PersonaLLMResponse | NewsLLMResponse | RivalLLMResponse> {
  requestId: string
  success: boolean
  data?: T
  error?: string
  tokensUsed?: number
  costEstimate?: number
}

// === GAME STATE TYPES ===
export interface GameState {
  player: PlayerData | null
  rival: RivalData
  personas: Map<string, Persona>
  posts: Post[]
  news: NewsItem[]
  loop: GameLoopState
  totalTokensUsed: number
  totalCost: number
}

// === UTILITY TYPES ===
export function describePoliticalLeaning(value: number): string {
  if (value <= -60) return 'strongly liberal'
  if (value <= -20) return 'moderate liberal'
  if (value <= 20) return 'centrist'
  if (value <= 60) return 'moderate conservative'
  return 'strongly conservative'
}

export function describeOpinion(value: number): string {
  if (value <= -60) return 'strongly negative'
  if (value <= -20) return 'negative'
  if (value <= 20) return 'neutral'
  if (value <= 60) return 'positive'
  return 'strongly positive'
}
