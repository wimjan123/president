import { ComposeBox } from '../Compose/ComposeBox'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function RightSidebar() {
  const { rival, totalTokensUsed, totalCost } = useGameStore()
  const { hasValidApiKey, mockMode, rivalName, rivalHandle, rivalMinInterval, rivalMaxInterval } = useSettingsStore()

  return (
    <div className="space-y-6">
      {/* Compose Box */}
      <ComposeBox />

      {/* Rival Activity */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          Opponent
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rival/20 border border-rival/30 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-rival">
              {rivalName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{rivalName}</p>
            <p className="text-xs text-[var(--text-muted)]">{rivalHandle}</p>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          {rival.party} candidate. Posts every {rivalMinInterval}-{rivalMaxInterval}s.
        </p>
      </div>

      {/* API Status */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          API Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Mode</span>
            <span
              className={`font-medium ${mockMode ? 'text-gold' : hasValidApiKey() ? 'text-[var(--success)]' : 'text-rival'}`}
            >
              {mockMode ? 'Mock' : hasValidApiKey() ? 'Live' : 'No API Key'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Tokens Used</span>
            <span className="font-mono text-[var(--text-primary)]">
              {totalTokensUsed.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Est. Cost</span>
            <span className="font-mono text-[var(--text-primary)]">
              ${totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="card p-5">
        <h2 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Controls
        </h2>
        <div className="space-y-2 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-overlay rounded text-[var(--text-secondary)]">
              Space
            </kbd>
            <span>Pause / Resume</span>
          </div>
        </div>
      </div>
    </div>
  )
}
