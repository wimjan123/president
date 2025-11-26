import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { formatNumber } from '../../utils/engagementCalculator'

export function GameHeader() {
  const { player, loop, followers, getPlayerFavorability, getRivalFavorability } = useGameStore()
  const { isPaused, togglePause, openModal } = useUIStore()

  const playerFav = getPlayerFavorability()
  const rivalFav = getRivalFavorability()

  const formatTime = (ticks: number): string => {
    const totalSeconds = ticks
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-[60px] flex items-center justify-between">
        {/* Left - Player Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-player/20 border border-player/30 flex items-center justify-center">
              <span className="text-sm font-display font-bold text-player">
                {player?.candidateName.charAt(0) ?? 'P'}
              </span>
            </div>
            <div>
              <p className="text-sm font-display font-bold text-[var(--text-primary)]">
                {player?.candidateName ?? 'Player'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{player?.party}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            {/* Follower Count */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span className="font-mono text-[var(--text-primary)] font-medium">{formatNumber(followers.total)}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">You:</span>
              <span className="font-mono text-player font-medium">{playerFav}%</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Rival:</span>
              <span className="font-mono text-rival font-medium">{rivalFav}%</span>
            </div>
          </div>
        </div>

        {/* Center - Timer */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePause}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isPaused
                ? 'bg-gold/10 border-gold/30 text-gold animate-pulse-pause'
                : 'bg-overlay border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="font-display font-medium">Resume</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
                <span className="font-display font-medium">Pause</span>
              </>
            )}
          </button>

          <div className="font-mono text-sm text-[var(--text-secondary)]">
            {formatTime(loop.currentTick)}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('settings')}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-overlay transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
