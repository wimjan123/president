import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useUIStore } from '../stores/uiStore'

export function useResponseDisplay() {
  const { posts, loop, setReactionDisplayed } = useGameStore()
  const { isPaused } = useUIStore()

  useEffect(() => {
    if (isPaused) return

    // Check all posts for reactions that should now be displayed
    posts.forEach((post) => {
      post.reactions.forEach((reaction) => {
        if (!reaction.isDisplayed && reaction.displayedAt <= loop.currentTick) {
          setReactionDisplayed(post.id, reaction.personaId)
        }
      })
    })
  }, [loop.currentTick, isPaused, posts, setReactionDisplayed])
}
