import { useGameStore } from './stores/gameStore'
import { useUIStore } from './stores/uiStore'
import { PlayerSetup } from './components/Setup/PlayerSetup'
import { GameView } from './components/Game/GameView'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import { ToastContainer } from './components/shared/ToastContainer'

function App() {
  const { isInitialized } = useGameStore()
  const { activeModal } = useUIStore()

  return (
    <div className="min-h-screen bg-base gradient-atmosphere animate-atmosphere">
      {/* Background grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10">
        {isInitialized() ? <GameView /> : <PlayerSetup />}
      </div>

      {/* Modals */}
      {activeModal === 'settings' && <SettingsPanel />}

      {/* Toasts */}
      <ToastContainer />
    </div>
  )
}

export default App
