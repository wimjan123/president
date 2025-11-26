import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { ISSUES, ISSUE_LABELS, type Issue, type Party, type PlayerData } from '../../types'

export function PlayerSetup() {
  const { initializeGame } = useGameStore()
  const { openModal } = useUIStore()

  const [candidateName, setCandidateName] = useState('')
  const [party, setParty] = useState<Party>('Democrat')
  const [customParty, setCustomParty] = useState('')
  const [politicalPosition, setPoliticalPosition] = useState(0)
  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([])

  const handleIssueToggle = (issue: Issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue))
    } else if (selectedIssues.length < 3) {
      setSelectedIssues([...selectedIssues, issue])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!candidateName.trim() || selectedIssues.length !== 3) return

    const playerData: PlayerData = {
      candidateName: candidateName.trim(),
      party: party === 'Independent' && customParty ? customParty : party,
      politicalPosition,
      priorityIssues: selectedIssues as [Issue, Issue, Issue],
    }

    initializeGame(playerData)
  }

  const getPositionLabel = (value: number): string => {
    if (value <= -60) return 'Strongly Liberal'
    if (value <= -20) return 'Moderate Liberal'
    if (value <= 20) return 'Centrist'
    if (value <= 60) return 'Moderate Conservative'
    return 'Strongly Conservative'
  }

  const isValid = candidateName.trim().length >= 2 && selectedIssues.length === 3

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-[var(--text-primary)] mb-3">
            Election Campaign Simulator
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Create your candidate and enter the race
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="card p-8 space-y-8">
          {/* Candidate Name */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-2">
              Candidate Name
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter your candidate's name"
              className="input"
              maxLength={50}
            />
          </div>

          {/* Party Selection */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-3">
              Party Affiliation
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Democrat', 'Republican', 'Independent'] as Party[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setParty(p)}
                  className={`chip ${party === p ? 'chip-selected' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
            {party === 'Independent' && (
              <input
                type="text"
                value={customParty}
                onChange={(e) => setCustomParty(e.target.value)}
                placeholder="Custom party name (optional)"
                className="input mt-3"
                maxLength={30}
              />
            )}
          </div>

          {/* Political Position */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-3">
              Political Position
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="-100"
                max="100"
                value={politicalPosition}
                onChange={(e) => setPoliticalPosition(Number(e.target.value))}
                className="w-full h-2 bg-overlay rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-player
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Far Left</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {getPositionLabel(politicalPosition)}
                </span>
                <span>Far Right</span>
              </div>
            </div>
          </div>

          {/* Priority Issues */}
          <div>
            <label className="block text-sm font-display font-medium text-[var(--text-secondary)] mb-3">
              Top 3 Priority Issues
              <span className="text-[var(--text-muted)] font-normal ml-2">
                ({selectedIssues.length}/3 selected)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ISSUES.map((issue) => {
                const isSelected = selectedIssues.includes(issue)
                const isDisabled = !isSelected && selectedIssues.length >= 3
                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => handleIssueToggle(issue)}
                    disabled={isDisabled}
                    className={`chip ${isSelected ? 'chip-selected' : ''} ${
                      isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    {ISSUE_LABELS[issue]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => openModal('settings')}
              className="btn-secondary"
            >
              Settings
            </button>
            <button type="submit" disabled={!isValid} className="btn-primary">
              Start Campaign
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Your opponent will be Senator Patricia Morgan from the opposing party
        </p>
      </div>
    </div>
  )
}
