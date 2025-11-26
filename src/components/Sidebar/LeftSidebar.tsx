import { useGameStore } from '../../stores/gameStore'
import { ISSUE_LABELS, type Issue } from '../../types'

export function LeftSidebar() {
  const { player, rival, posts, news, getPlayerFavorability, getRivalFavorability, personas } = useGameStore()

  const playerFav = getPlayerFavorability()
  const rivalFav = getRivalFavorability()

  // Calculate trending issues based on recent posts and news (dynamic)
  const getTrendingIssues = (): { issue: Issue; count: number }[] => {
    const counts: Partial<Record<Issue, number>> = {}

    // Start with persona priorities as baseline (always have something)
    personas.forEach((persona) => {
      persona.priorityIssues.forEach((issue, index) => {
        const weight = 3 - index
        counts[issue] = (counts[issue] || 0) + weight
      })
    })

    // Boost based on recent posts (newer = higher boost)
    posts.slice(0, 20).forEach((post, index) => {
      const recencyWeight = Math.max(1, 20 - index)
      const engagementWeight = 1 + (post.reactions.length / 5)

      post.issueTags.forEach((issue) => {
        counts[issue] = (counts[issue] || 0) + recencyWeight * engagementWeight * 2
      })
    })

    // Also boost from news events
    news.slice(0, 5).forEach((item, index) => {
      const recencyWeight = Math.max(1, 5 - index)
      item.affectedIssues.forEach((issue) => {
        counts[issue as Issue] = (counts[issue as Issue] || 0) + recencyWeight * 3
      })
    })

    return Object.entries(counts)
      .map(([issue, count]) => ({ issue: issue as Issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const topIssues = getTrendingIssues()
  const maxIssueCount = topIssues[0]?.count || 1

  return (
    <div className="space-y-6">
      {/* Public Opinion */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          Public Opinion
        </h2>

        {/* Player */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-primary)]">
              {player?.candidateName ?? 'You'}
            </span>
            <span className="font-mono text-lg font-medium text-player">{playerFav}%</span>
          </div>
          <div className="h-2 bg-overlay rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-player to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${playerFav}%` }}
            />
          </div>
        </div>

        {/* Rival */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-primary)]">{rival.name}</span>
            <span className="font-mono text-lg font-medium text-rival">{rivalFav}%</span>
          </div>
          <div className="h-2 bg-overlay rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rival to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${rivalFav}%` }}
            />
          </div>
        </div>

        {/* Spread */}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Spread</span>
            <span
              className={`font-mono font-medium ${
                playerFav > rivalFav
                  ? 'text-[var(--success)]'
                  : playerFav < rivalFav
                    ? 'text-rival'
                    : 'text-[var(--text-secondary)]'
              }`}
            >
              {playerFav > rivalFav ? '+' : ''}
              {playerFav - rivalFav}%
            </span>
          </div>
        </div>
      </div>

      {/* Trending Issues */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          Trending Issues
        </h2>

        <div className="space-y-3">
          {topIssues.map(({ issue, count }, index) => (
            <div key={issue} className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--text-muted)] w-4">
                {index + 1}.
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-primary)]">
                    {ISSUE_LABELS[issue]}
                  </span>
                </div>
                <div className="h-1 bg-overlay rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan rounded-full"
                    style={{ width: `${(count / maxIssueCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Citizens */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          Citizens
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-mono text-2xl font-medium text-[var(--text-primary)]">
              {personas.size}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Total</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="font-mono text-2xl font-medium text-[var(--success)]">
              {Array.from(personas.values()).filter((p) => p.opinionOfPlayer > 20).length}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Supporters</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="font-mono text-2xl font-medium text-rival">
              {Array.from(personas.values()).filter((p) => p.opinionOfPlayer < -20).length}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Opposed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
