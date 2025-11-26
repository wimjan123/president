import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { usePersonaResponses } from '../../hooks/usePersonaResponses'
import { ISSUES, ISSUE_LABELS, type Issue, type Post } from '../../types'

const MAX_LENGTH = 280

export function ComposeBox() {
  const { player, loop, addPost, posts } = useGameStore()
  const { isPaused, addToast } = useUIStore()
  const { generateResponses } = usePersonaResponses()

  const [content, setContent] = useState('')
  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([])

  const latestPost = posts[0]
  const isProcessing = latestPost?.isProcessing ?? false

  const handleIssueToggle = (issue: Issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue))
    } else if (selectedIssues.length < 3) {
      setSelectedIssues([...selectedIssues, issue])
    }
  }

  const handleSubmit = () => {
    if (!content.trim() || isPaused || isProcessing || !player) return

    const post: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'player',
      author: {
        name: player.candidateName,
        handle: `@${player.candidateName.toLowerCase().replace(/\s+/g, '')}`,
        avatarSeed: 'player',
      },
      content: content.trim(),
      issueTags: selectedIssues,
      timestamp: loop.currentTick,
      reactions: [],
      isProcessing: true,
      engagement: {
        likes: 0,
        retweets: 0,
        dislikes: 0,
        displayedLikes: 0,
        displayedRetweets: 0,
        displayedDislikes: 0,
      },
    }

    addPost(post)
    setContent('')
    setSelectedIssues([])

    addToast({
      type: 'info',
      message: 'Post published! Waiting for responses...',
      duration: 3000,
    })

    // Trigger persona response generation
    generateResponses(post)
  }

  const charsRemaining = MAX_LENGTH - content.length
  const isOverLimit = charsRemaining < 0
  const canPost = content.trim().length > 0 && !isOverLimit && !isPaused && !isProcessing

  return (
    <div className="card p-5">
      <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
        Compose Post
      </h2>

      {/* Text Area */}
      <div
        className={`bg-overlay rounded-lg border transition-colors ${
          content.length > 0
            ? 'border-[var(--player-border)] ring-2 ring-[var(--player-glow)]'
            : 'border-white/10'
        }`}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your message to voters?"
          disabled={isPaused || isProcessing}
          className="w-full min-h-[100px] p-3 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     resize-none focus:outline-none disabled:opacity-50"
          maxLength={MAX_LENGTH + 50}
        />

        {/* Character Counter */}
        <div className="px-3 pb-2 flex justify-end">
          <span
            className={`text-xs font-mono ${
              isOverLimit
                ? 'text-rival'
                : charsRemaining < 50
                  ? 'text-gold'
                  : 'text-[var(--text-muted)]'
            }`}
          >
            {charsRemaining}
          </span>
        </div>
      </div>

      {/* Issue Tags */}
      <div className="mt-4">
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Tag issues (optional, up to 3)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ISSUES.map((issue) => {
            const isSelected = selectedIssues.includes(issue)
            const isDisabled = !isSelected && selectedIssues.length >= 3
            return (
              <button
                key={issue}
                type="button"
                onClick={() => handleIssueToggle(issue)}
                disabled={isDisabled || isPaused}
                className={`px-2 py-1 text-xs rounded-full border transition-all ${
                  isSelected
                    ? 'bg-[var(--player-glow)] border-[var(--player-border)] text-player'
                    : 'bg-transparent border-white/10 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {ISSUE_LABELS[issue]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Post Button */}
      <button
        onClick={handleSubmit}
        disabled={!canPost}
        className="w-full mt-4 btn-primary"
      >
        {isProcessing ? 'Waiting for responses...' : isPaused ? 'Resume to Post' : 'Post'}
      </button>

      {/* Status Messages */}
      {isPaused && (
        <p className="text-xs text-gold text-center mt-2">Game is paused. Resume to post.</p>
      )}
      {isProcessing && (
        <p className="text-xs text-cyan text-center mt-2">Personas are responding...</p>
      )}
    </div>
  )
}
