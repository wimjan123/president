import { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import { useUIStore } from '../../stores/uiStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useResponseDisplay } from '../../hooks/useResponseDisplay'
import { useGameEvents } from '../../hooks/useGameEvents'
import { LeftSidebar } from '../Sidebar/LeftSidebar'
import { RightSidebar } from '../Sidebar/RightSidebar'
import { Feed } from '../Feed/Feed'
import { GameHeader } from './GameHeader'
import { PauseOverlay } from './PauseOverlay'

export function GameView() {
  const { tick } = useGameStore()
  const { isPaused, togglePause } = useUIStore()
  const { tickSpeed } = useSettingsStore()

  // Display responses at their scheduled tick
  useResponseDisplay()

  // Handle news and rival post events
  useGameEvents()

  // Game loop - tick every tickSpeed ms
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      tick()
    }, tickSpeed)

    return () => clearInterval(interval)
  }, [isPaused, tickSpeed, tick])

  // Keyboard shortcut for pause
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        togglePause()
      }
    },
    [togglePause]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader />

      <div className="flex-1 flex">
        {/* Main Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-0 lg:gap-6 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-6">
          {/* Left Sidebar - Opinion Dashboard */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px]">
              <LeftSidebar />
            </div>
          </aside>

          {/* Center - Feed */}
          <main className="min-w-0">
            <Feed />
          </main>

          {/* Right Sidebar - Compose & Info */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px]">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && <PauseOverlay />}
      </AnimatePresence>
    </div>
  )
}
