import { useGameStore } from '../../stores/gameStore'
import { ISSUE_LABELS, type Post } from '../../types'
import { ResponseItem } from './ResponseItem'

interface PostCardProps {
  post: Post
  isNew?: boolean
}

export function PostCard({ post, isNew }: PostCardProps) {
  const { loop } = useGameStore()

  const displayedReactions = post.reactions.filter((r) => r.isDisplayed)
  const pendingReactions = post.reactions.filter((r) => !r.isDisplayed)

  // Calculate aggregate stats
  const stats = {
    comments: displayedReactions.filter((r) => r.reactionType === 'comment').length,
    likes: displayedReactions.filter((r) => r.reactionType === 'like').length,
    angry: displayedReactions.filter((r) => r.reactionType === 'angry').length,
    laugh: displayedReactions.filter((r) => r.reactionType === 'laugh').length,
    shares: displayedReactions.filter((r) => r.reactionType === 'share').length,
  }

  const totalEngagement =
    stats.comments + stats.likes + stats.angry + stats.laugh + stats.shares

  const sentimentSum = displayedReactions.reduce((sum, r) => sum + r.sentimentShift, 0)

  const getBorderClass = () => {
    switch (post.type) {
      case 'player':
        return 'border-l-player'
      case 'rival':
        return 'border-l-rival'
      case 'news':
        return 'border-l-gold'
      default:
        return 'border-l-transparent'
    }
  }

  const getGradientClass = () => {
    switch (post.type) {
      case 'player':
        return 'gradient-player'
      case 'rival':
        return 'gradient-rival'
      case 'news':
        return 'gradient-news'
      default:
        return ''
    }
  }

  const formatTimestamp = (tick: number): string => {
    const elapsed = loop.currentTick - tick
    if (elapsed < 60) return `${elapsed}s ago`
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`
    return `${Math.floor(elapsed / 3600)}h ago`
  }

  return (
    <article
      className={`card border-l-4 ${getBorderClass()} ${getGradientClass()} ${
        isNew ? 'animate-post-enter' : ''
      }`}
    >
      {/* Post Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              post.type === 'player'
                ? 'bg-player/20 border border-player/30'
                : post.type === 'rival'
                  ? 'bg-rival/20 border border-rival/30'
                  : 'bg-gold/20 border border-gold/30'
            }`}
          >
            <span
              className={`text-sm font-display font-bold ${
                post.type === 'player'
                  ? 'text-player'
                  : post.type === 'rival'
                    ? 'text-rival'
                    : 'text-gold'
              }`}
            >
              {post.type === 'news' ? 'N' : post.author.name.charAt(0)}
            </span>
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[var(--text-primary)]">
                {post.type === 'news' ? 'Breaking News' : post.author.name}
              </span>
              {post.type !== 'news' && (
                <span className="text-sm text-[var(--text-muted)]">
                  {post.author.handle}
                </span>
              )}
              <span className="text-sm text-[var(--text-muted)]">
                {formatTimestamp(post.timestamp)}
              </span>
            </div>

            {/* Post Content */}
            <p className="mt-2 text-[var(--text-primary)] whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Issue Tags */}
            {post.issueTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.issueTags.map((issue) => (
                  <span
                    key={issue}
                    className="px-2 py-0.5 text-xs rounded-full bg-overlay text-[var(--text-secondary)]"
                  >
                    {ISSUE_LABELS[issue]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      {(totalEngagement > 0 || post.isProcessing) && (
        <div className="px-4 py-3 border-t border-white/[0.06] mt-4">
          <div className="flex items-center gap-4 text-sm">
            {stats.comments > 0 && (
              <span className="text-[var(--text-secondary)]">
                <span className="font-mono">{stats.comments}</span> comments
              </span>
            )}
            {stats.likes > 0 && (
              <span className="text-[var(--text-secondary)]">
                <span className="font-mono">{stats.likes}</span> likes
              </span>
            )}
            {stats.angry > 0 && (
              <span className="text-rival">
                <span className="font-mono">{stats.angry}</span> angry
              </span>
            )}
            {stats.laugh > 0 && (
              <span className="text-gold">
                <span className="font-mono">{stats.laugh}</span> laughs
              </span>
            )}
            {stats.shares > 0 && (
              <span className="text-cyan">
                <span className="font-mono">{stats.shares}</span> shares
              </span>
            )}

            {/* Sentiment Indicator */}
            {totalEngagement > 0 && (
              <span
                className={`ml-auto font-mono ${
                  sentimentSum > 0
                    ? 'text-[var(--success)]'
                    : sentimentSum < 0
                      ? 'text-rival'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                {sentimentSum > 0 ? '+' : ''}
                {sentimentSum} sentiment
              </span>
            )}

            {/* Processing Indicator */}
            {post.isProcessing && pendingReactions.length > 0 && (
              <span className="text-cyan animate-pulse">
                {pendingReactions.length} more incoming...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Responses */}
      {displayedReactions.length > 0 && (
        <div className="border-t border-white/[0.06]">
          {displayedReactions
            .filter((r) => r.reactionType === 'comment' && r.comment)
            .map((reaction, index) => (
              <ResponseItem
                key={`${reaction.personaId}-${index}`}
                reaction={reaction}
                isNew={post.isProcessing}
              />
            ))}
        </div>
      )}
    </article>
  )
}
