import { useGameStore } from '../../stores/gameStore'
import { ISSUE_LABELS, type Post } from '../../types'
import { formatNumber } from '../../utils/engagementCalculator'
import { ResponseItem } from './ResponseItem'

interface PostCardProps {
  post: Post
  isNew?: boolean
}

export function PostCard({ post, isNew }: PostCardProps) {
  const { loop } = useGameStore()

  const displayedReactions = post.reactions.filter((r) => r.isDisplayed)
  const pendingReactions = post.reactions.filter((r) => !r.isDisplayed)

  // Calculate comment-based stats (from actual personas who commented)
  const commentStats = {
    comments: displayedReactions.filter((r) => r.reactionType === 'comment').length,
    likes: displayedReactions.filter((r) => r.reactionType === 'like').length,
    angry: displayedReactions.filter((r) => r.reactionType === 'angry').length,
    laugh: displayedReactions.filter((r) => r.reactionType === 'laugh').length,
    retweets: displayedReactions.filter((r) => r.reactionType === 'retweet').length,
  }

  // Get scaled engagement numbers (representing broader audience)
  const engagement = post.engagement

  const totalEngagement =
    commentStats.comments + commentStats.likes + commentStats.angry +
    commentStats.laugh + commentStats.retweets +
    (engagement?.displayedLikes || 0) + (engagement?.displayedRetweets || 0)

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
      {(totalEngagement > 0 || post.isProcessing || engagement) && (
        <div className="px-4 py-3 border-t border-white/[0.06] mt-4">
          {/* Main engagement row - scaled numbers */}
          {engagement && (engagement.displayedLikes > 0 || engagement.displayedRetweets > 0 || engagement.displayedDislikes > 0) && (
            <div className="flex items-center gap-6 text-sm mb-2">
              {engagement.displayedLikes > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="font-mono font-medium">{formatNumber(engagement.displayedLikes)}</span>
                </span>
              )}
              {engagement.displayedRetweets > 0 && (
                <span className="flex items-center gap-1.5 text-cyan">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                  <span className="font-mono font-medium">{formatNumber(engagement.displayedRetweets)}</span>
                </span>
              )}
              {engagement.displayedDislikes > 0 && (
                <span className="flex items-center gap-1.5 text-rival">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                  </svg>
                  <span className="font-mono font-medium">{formatNumber(engagement.displayedDislikes)}</span>
                </span>
              )}
            </div>
          )}

          {/* Comment stats row */}
          <div className="flex items-center gap-4 text-sm">
            {commentStats.comments > 0 && (
              <span className="text-[var(--text-secondary)]">
                <span className="font-mono">{commentStats.comments}</span> comments
              </span>
            )}
            {commentStats.likes > 0 && (
              <span className="text-[var(--text-secondary)]">
                <span className="font-mono">{commentStats.likes}</span> persona likes
              </span>
            )}
            {commentStats.angry > 0 && (
              <span className="text-rival">
                <span className="font-mono">{commentStats.angry}</span> angry
              </span>
            )}
            {commentStats.laugh > 0 && (
              <span className="text-gold">
                <span className="font-mono">{commentStats.laugh}</span> laughs
              </span>
            )}
            {commentStats.retweets > 0 && (
              <span className="text-cyan">
                <span className="font-mono">{commentStats.retweets}</span> persona retweets
              </span>
            )}

            {/* Sentiment Indicator */}
            {displayedReactions.length > 0 && (
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
