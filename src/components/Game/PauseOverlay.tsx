import { motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'

export function PauseOverlay() {
  const { togglePause } = useUIStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-30 pointer-events-none"
      style={{
        background: 'rgba(245, 158, 11, 0.03)',
      }}
    >
      {/* Subtle pulsing border effect */}
      <div className="absolute inset-0 border-4 border-gold/10 animate-pulse" />

      {/* Center indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          onClick={togglePause}
          className="flex items-center gap-3 px-6 py-3 bg-surface/90 backdrop-blur border border-gold/30 rounded-xl
                     text-gold font-display font-bold shadow-lg hover:bg-elevated transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>PAUSED</span>
          <span className="text-sm font-normal text-gold/70">(Press Space)</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
