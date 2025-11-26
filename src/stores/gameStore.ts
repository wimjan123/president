import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type {
  GameState,
  PlayerData,
  RivalData,
  Persona,
  Post,
  PostReaction,
  NewsItem,
  ScheduledEvent,
  PostEngagement,
} from '../types'
import { initialPersonas } from '../data/personas'

const DEFAULT_RIVAL: RivalData = {
  name: 'Senator Patricia Morgan',
  party: 'Republican',
  politicalPosition: 45,
  handle: '@SenMorgan',
  avatarSeed: 'patricia-morgan',
}

interface GameStoreState extends GameState {
  // Initialization
  initializeGame: (player: PlayerData) => void
  resetGame: () => void
  isInitialized: () => boolean

  // Persona actions
  updatePersonaOpinion: (personaId: string, playerDelta: number, rivalDelta?: number) => void
  setPersonaLastResponse: (personaId: string, tick: number) => void
  getPersona: (personaId: string) => Persona | undefined

  // Post actions
  addPost: (post: Post) => void
  addReactionToPost: (postId: string, reaction: PostReaction) => void
  setReactionDisplayed: (postId: string, personaId: string) => void
  setPostProcessing: (postId: string, processing: boolean) => void

  // News actions
  addNews: (news: NewsItem) => void

  // Game loop actions
  tick: () => void
  scheduleEvent: (event: Omit<ScheduledEvent, 'id' | 'completed'>) => void
  completeEvent: (eventId: string) => void
  getDueEvents: () => ScheduledEvent[]

  // Stats
  addTokenUsage: (tokens: number, cost: number) => void
  getPlayerFavorability: () => number
  getRivalFavorability: () => number

  // Follower actions
  updateFollowers: (delta: number, reason: string) => void

  // Engagement actions
  updatePostEngagement: (postId: string, engagement: PostEngagement) => void
}

function createInitialGameState(): GameState {
  return {
    player: null,
    rival: DEFAULT_RIVAL,
    personas: new Map(),
    posts: [],
    news: [],
    loop: {
      currentTick: 0,
      lastTickTime: Date.now(),
      scheduledEvents: [],
    },
    totalTokensUsed: 0,
    totalCost: 0,
    followers: {
      total: 0,
      history: [],
    },
  }
}

export const useGameStore = create<GameStoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...createInitialGameState(),

        initializeGame: (player) => {
          // Adjust rival party based on player
          const rivalParty = player.party === 'Democrat' ? 'Republican' : 'Democrat'
          const rivalPosition = player.party === 'Democrat' ? 45 : -45

          set({
            player,
            rival: {
              ...DEFAULT_RIVAL,
              party: rivalParty,
              politicalPosition: rivalPosition,
            },
            personas: new Map(initialPersonas.map((p) => [p.id, { ...p }])),
            posts: [],
            news: [],
            loop: {
              currentTick: 0,
              lastTickTime: Date.now(),
              scheduledEvents: [],
            },
            totalTokensUsed: 0,
            totalCost: 0,
            followers: {
              total: 0,
              history: [],
            },
          })
        },

        resetGame: () => {
          set(createInitialGameState())
        },

        isInitialized: () => {
          return get().player !== null
        },

        updatePersonaOpinion: (personaId, playerDelta, rivalDelta = 0) => {
          set((state) => {
            const persona = state.personas.get(personaId)
            if (!persona) return state

            const newPersonas = new Map(state.personas)
            newPersonas.set(personaId, {
              ...persona,
              opinionOfPlayer: Math.max(-100, Math.min(100, persona.opinionOfPlayer + playerDelta)),
              opinionOfRival: Math.max(-100, Math.min(100, persona.opinionOfRival + rivalDelta)),
            })

            return { personas: newPersonas }
          })
        },

        setPersonaLastResponse: (personaId, tick) => {
          set((state) => {
            const persona = state.personas.get(personaId)
            if (!persona) return state

            const newPersonas = new Map(state.personas)
            newPersonas.set(personaId, {
              ...persona,
              lastResponseTick: tick,
            })

            return { personas: newPersonas }
          })
        },

        getPersona: (personaId) => {
          return get().personas.get(personaId)
        },

        addPost: (post) => {
          set((state) => ({
            posts: [post, ...state.posts].slice(0, 100),
          }))
        },

        addReactionToPost: (postId, reaction) => {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, reactions: [...p.reactions, reaction] } : p
            ),
          }))
        },

        setReactionDisplayed: (postId, personaId) => {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    reactions: p.reactions.map((r) =>
                      r.personaId === personaId ? { ...r, isDisplayed: true } : r
                    ),
                  }
                : p
            ),
          }))
        },

        setPostProcessing: (postId, processing) => {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, isProcessing: processing } : p
            ),
          }))
        },

        addNews: (news) => {
          set((state) => ({
            news: [news, ...state.news].slice(0, 20),
          }))
        },

        tick: () => {
          set((state) => ({
            loop: {
              ...state.loop,
              currentTick: state.loop.currentTick + 1,
              lastTickTime: Date.now(),
            },
          }))
        },

        scheduleEvent: (event) => {
          const id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          set((state) => ({
            loop: {
              ...state.loop,
              scheduledEvents: [
                ...state.loop.scheduledEvents,
                { ...event, id, completed: false },
              ],
            },
          }))
        },

        completeEvent: (eventId) => {
          set((state) => ({
            loop: {
              ...state.loop,
              scheduledEvents: state.loop.scheduledEvents.map((e) =>
                e.id === eventId ? { ...e, completed: true } : e
              ),
            },
          }))
        },

        getDueEvents: () => {
          const { loop } = get()
          return loop.scheduledEvents.filter(
            (e) => !e.completed && e.triggerTick <= loop.currentTick
          )
        },

        addTokenUsage: (tokens, cost) => {
          set((state) => ({
            totalTokensUsed: state.totalTokensUsed + tokens,
            totalCost: state.totalCost + cost,
          }))
        },

        getPlayerFavorability: () => {
          const { personas } = get()
          if (personas.size === 0) return 50

          let total = 0
          personas.forEach((persona) => {
            total += persona.opinionOfPlayer
          })
          const avg = total / personas.size
          return Math.round(((avg + 100) / 200) * 100)
        },

        getRivalFavorability: () => {
          const { personas } = get()
          if (personas.size === 0) return 50

          let total = 0
          personas.forEach((persona) => {
            total += persona.opinionOfRival
          })
          const avg = total / personas.size
          return Math.round(((avg + 100) / 200) * 100)
        },

        updateFollowers: (delta, reason) => {
          set((state) => ({
            followers: {
              total: Math.max(0, state.followers.total + delta),
              history: [
                { delta, reason, tick: state.loop.currentTick },
                ...state.followers.history.slice(0, 49),
              ],
            },
          }))
        },

        updatePostEngagement: (postId, engagement) => {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, engagement } : p
            ),
          }))
        },
      }),
      {
        name: 'president-game-state',
        partialize: (state) => ({
          player: state.player,
          rival: state.rival,
          personas: Array.from(state.personas.entries()),
          posts: state.posts.slice(0, 50),
          news: state.news.slice(0, 10),
          loop: {
            currentTick: state.loop.currentTick,
            lastTickTime: state.loop.lastTickTime,
            scheduledEvents: state.loop.scheduledEvents.filter((e) => !e.completed),
          },
          totalTokensUsed: state.totalTokensUsed,
          totalCost: state.totalCost,
          followers: state.followers,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<GameState & { personas: [string, Persona][] }>
          return {
            ...currentState,
            ...persisted,
            personas: persisted.personas
              ? new Map(persisted.personas)
              : currentState.personas,
          }
        },
      }
    )
  )
)
