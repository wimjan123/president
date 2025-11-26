import { useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import { useOpenRouter } from './useOpenRouter'
import { usePersonaResponses } from './usePersonaResponses'
import { buildNewsGenerationPrompt, buildRivalPostPrompt } from '../utils/prompts'
import { parseNewsResponse, parseRivalResponse } from '../utils/responseParser'
import type { Post, NewsItem, Issue } from '../types'

export function useGameEvents() {
  const {
    player,
    rival,
    posts,
    news,
    loop,
    addPost,
    addNews,
    getPlayerFavorability,
    getRivalFavorability,
  } = useGameStore()

  const {
    mockMode,
    rivalName,
    rivalHandle,
  } = useSettingsStore()
  const { isPaused, addToast } = useUIStore()
  const { queueRequest } = useOpenRouter()
  const { generateResponses } = usePersonaResponses()

  const nextNewsTick = useRef<number>(0)
  const nextRivalTick = useRef<number>(0)
  const initialized = useRef(false)

  // Schedule next news event (reads tick from store to avoid stale closure)
  const scheduleNextNews = useCallback(() => {
    const currentTick = useGameStore.getState().loop.currentTick
    const minInt = useSettingsStore.getState().newsMinInterval
    const maxInt = useSettingsStore.getState().newsMaxInterval
    const delay = minInt + Math.floor(Math.random() * (maxInt - minInt + 1))
    nextNewsTick.current = currentTick + delay
  }, [])

  // Schedule next rival post (reads tick from store to avoid stale closure)
  const scheduleNextRival = useCallback(() => {
    const currentTick = useGameStore.getState().loop.currentTick
    const minInt = useSettingsStore.getState().rivalMinInterval
    const maxInt = useSettingsStore.getState().rivalMaxInterval
    const delay = minInt + Math.floor(Math.random() * (maxInt - minInt + 1))
    nextRivalTick.current = currentTick + delay
  }, [])

  // Get hot issues based on recent posts
  const getHotIssues = useCallback((): Issue[] => {
    const counts: Partial<Record<Issue, number>> = {}

    posts.slice(0, 10).forEach((post) => {
      post.issueTags.forEach((issue) => {
        counts[issue] = (counts[issue] || 0) + 1
      })
    })

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue as Issue)
  }, [posts])

  // Generate news event
  const generateNews = useCallback(async () => {
    if (!player) return

    if (mockMode) {
      // Mock news
      const mockHeadlines = [
        { headline: 'Economic Report Shows Mixed Results', issues: ['economy'] as Issue[] },
        { headline: 'Healthcare Costs Continue to Rise', issues: ['healthcare'] as Issue[] },
        { headline: 'Poll Shows Tight Race in Key States', issues: [] as Issue[] },
        { headline: 'Climate Change Report Sparks Debate', issues: ['climate'] as Issue[] },
        { headline: 'Immigration Policy Under Scrutiny', issues: ['immigration'] as Issue[] },
      ]

      const mock = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)]

      const newsItem: NewsItem = {
        id: `news-${Date.now()}`,
        headline: mock.headline,
        description: 'This is a developing story that may affect the campaign.',
        affectedIssues: mock.issues,
        issueImpact: {},
        timestamp: loop.currentTick,
      }

      addNews(newsItem)

      // Create news post
      const newsPost: Post = {
        id: `post-news-${Date.now()}`,
        type: 'news',
        author: {
          name: 'Breaking News',
          handle: '@news',
          avatarSeed: 'news',
        },
        content: `${mock.headline}\n\nThis is a developing story that may affect the campaign.`,
        issueTags: mock.issues,
        timestamp: loop.currentTick,
        reactions: [],
        isProcessing: true,
        engagement: { likes: 0, retweets: 0, dislikes: 0, displayedLikes: 0, displayedRetweets: 0, displayedDislikes: 0 },
      }

      addPost(newsPost)
      generateResponses(newsPost)
      addToast({ type: 'info', message: 'Breaking News!', duration: 3000 })

      return
    }

    // Real LLM call
    try {
      const prompt = buildNewsGenerationPrompt(
        player,
        rival,
        getPlayerFavorability(),
        getRivalFavorability(),
        posts.slice(0, 5),
        getHotIssues()
      )

      const response = await queueRequest({
        prompt,
        type: 'news_generation',
      })

      if (response.success && response.data) {
        const parsed = parseNewsResponse(response.data)

        if (parsed) {
          const newsItem: NewsItem = {
            id: `news-${Date.now()}`,
            headline: parsed.headline,
            description: parsed.description,
            affectedIssues: parsed.affectedIssues as Issue[],
            issueImpact: {},
            timestamp: loop.currentTick,
          }

          addNews(newsItem)

          const newsPost: Post = {
            id: `post-news-${Date.now()}`,
            type: 'news',
            author: {
              name: 'Breaking News',
              handle: '@news',
              avatarSeed: 'news',
            },
            content: `${parsed.headline}\n\n${parsed.description}`,
            issueTags: parsed.affectedIssues as Issue[],
            timestamp: loop.currentTick,
            reactions: [],
            isProcessing: true,
            engagement: { likes: 0, retweets: 0, dislikes: 0, displayedLikes: 0, displayedRetweets: 0, displayedDislikes: 0 },
          }

          addPost(newsPost)
          generateResponses(newsPost)
          addToast({ type: 'info', message: 'Breaking News!', duration: 3000 })
        }
      }
    } catch (error) {
      console.error('Failed to generate news:', error)
    }
  }, [
    player,
    rival,
    mockMode,
    loop.currentTick,
    posts,
    addNews,
    addPost,
    addToast,
    queueRequest,
    getPlayerFavorability,
    getRivalFavorability,
    getHotIssues,
    generateResponses,
  ])

  // Generate rival post
  const generateRivalPost = useCallback(async () => {
    if (!player) return

    if (mockMode) {
      // Mock rival post
      const mockPosts = [
        { content: `My opponent talks a big game, but where are the results? Americans deserve better.`, issues: ['economy'] as Issue[] },
        { content: `While others make empty promises, I have a real plan for working families.`, issues: ['economy', 'healthcare'] as Issue[] },
        { content: `Leadership means making tough decisions, not just popular ones.`, issues: [] as Issue[] },
        { content: `I've delivered results before and I'll do it again. That's the difference.`, issues: [] as Issue[] },
        { content: `The choice is clear: experience and results, or more of the same failed policies.`, issues: [] as Issue[] },
      ]

      const mock = mockPosts[Math.floor(Math.random() * mockPosts.length)]

      const rivalPost: Post = {
        id: `post-rival-${Date.now()}`,
        type: 'rival',
        author: {
          name: rivalName,
          handle: rivalHandle,
          avatarSeed: rival.avatarSeed,
        },
        content: mock.content,
        issueTags: mock.issues,
        timestamp: loop.currentTick,
        reactions: [],
        isProcessing: true,
        engagement: { likes: 0, retweets: 0, dislikes: 0, displayedLikes: 0, displayedRetweets: 0, displayedDislikes: 0 },
      }

      addPost(rivalPost)
      generateResponses(rivalPost)
      addToast({ type: 'warning', message: 'Your opponent just posted!', duration: 3000 })

      return
    }

    // Real LLM call
    try {
      const recentNews = news.slice(0, 3).map((n) => n.headline)
      const prompt = buildRivalPostPrompt(
        player,
        { ...rival, name: rivalName, handle: rivalHandle },
        getPlayerFavorability(),
        getRivalFavorability(),
        posts.filter((p) => p.type === 'player').slice(0, 3),
        recentNews
      )

      const response = await queueRequest({
        prompt,
        type: 'rival_post',
      })

      if (response.success && response.data) {
        const parsed = parseRivalResponse(response.data)

        if (parsed) {
          const rivalPost: Post = {
            id: `post-rival-${Date.now()}`,
            type: 'rival',
            author: {
              name: rivalName,
              handle: rivalHandle,
              avatarSeed: rival.avatarSeed,
            },
            content: parsed.content,
            issueTags: parsed.issueTags as Issue[],
            timestamp: loop.currentTick,
            reactions: [],
            isProcessing: true,
            engagement: { likes: 0, retweets: 0, dislikes: 0, displayedLikes: 0, displayedRetweets: 0, displayedDislikes: 0 },
          }

          addPost(rivalPost)
          generateResponses(rivalPost)
          addToast({ type: 'warning', message: 'Your opponent just posted!', duration: 3000 })
        }
      }
    } catch (error) {
      console.error('Failed to generate rival post:', error)
    }
  }, [
    player,
    rival,
    mockMode,
    rivalName,
    rivalHandle,
    loop.currentTick,
    posts,
    news,
    addPost,
    addToast,
    queueRequest,
    getPlayerFavorability,
    getRivalFavorability,
    generateResponses,
  ])

  // Initialize scheduled events
  useEffect(() => {
    if (!player || initialized.current) return

    initialized.current = true
    scheduleNextNews()
    // First rival post appears sooner (30-60s) to feel more alive
    const currentTick = useGameStore.getState().loop.currentTick
    nextRivalTick.current = currentTick + 30 + Math.floor(Math.random() * 30)
  }, [player, scheduleNextNews])

  // Check for due events on each tick
  useEffect(() => {
    if (isPaused || !player) return

    // Check news
    if (nextNewsTick.current > 0 && loop.currentTick >= nextNewsTick.current) {
      generateNews()
      scheduleNextNews()
    }

    // Check rival post
    if (nextRivalTick.current > 0 && loop.currentTick >= nextRivalTick.current) {
      generateRivalPost()
      scheduleNextRival()
    }
  }, [
    loop.currentTick,
    isPaused,
    player,
    generateNews,
    generateRivalPost,
    scheduleNextNews,
    scheduleNextRival,
  ])

  return {
    nextNewsIn: Math.max(0, nextNewsTick.current - loop.currentTick),
    nextRivalIn: Math.max(0, nextRivalTick.current - loop.currentTick),
  }
}
