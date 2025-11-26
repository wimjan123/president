import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import { PostCard } from './PostCard'

export function Feed() {
  const { posts } = useGameStore()

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] text-center"
      >
        <div className="w-16 h-16 rounded-full bg-overlay flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mb-2">
          No posts yet
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Compose your first campaign message and see how citizens react to your positions.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            layout
          >
            <PostCard post={post} isNew={index === 0} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
