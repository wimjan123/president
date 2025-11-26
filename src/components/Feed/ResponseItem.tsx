import { motion } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import type { PostReaction } from '../../types'

interface ResponseItemProps {
  reaction: PostReaction
  isNew?: boolean
}

export function ResponseItem({ reaction, isNew }: ResponseItemProps) {
  const { getPersona } = useGameStore()

  const persona = getPersona(reaction.personaId)
  if (!persona || !reaction.comment) return null

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -10 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="px-4 py-3 border-b border-white/[0.03] last:border-b-0 hover:bg-elevated/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-overlay flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-display font-bold text-[var(--text-secondary)]">
            {persona.name.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-medium text-sm text-[var(--text-primary)]">
              {persona.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{persona.handle}</span>

            {/* Sentiment Badge */}
            <span
              className={`ml-auto px-1.5 py-0.5 text-xs rounded font-mono ${
                reaction.sentimentShift > 0
                  ? 'bg-[var(--success)]/10 text-[var(--success)]'
                  : reaction.sentimentShift < 0
                    ? 'bg-rival/10 text-rival'
                    : 'bg-overlay text-[var(--text-muted)]'
              }`}
            >
              {reaction.sentimentShift > 0 ? '+' : ''}
              {reaction.sentimentShift}
            </span>
          </div>

          <p className="text-sm text-[var(--text-primary)] mt-1">{reaction.comment}</p>

          {/* Persona Info Hint */}
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {persona.occupation} from {persona.location}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
