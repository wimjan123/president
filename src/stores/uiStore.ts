import { create } from 'zustand'
import type { UIState, ModalType, Toast } from '../types'

interface UIStoreState extends UIState {
  setPaused: (paused: boolean) => void
  togglePause: () => void
  openModal: (modal: ModalType) => void
  closeModal: () => void
  selectPersona: (personaId: string | null) => void
  incrementPendingResponses: () => void
  decrementPendingResponses: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStoreState>((set) => ({
  isPaused: true,
  activeModal: null,
  selectedPersonaId: null,
  pendingResponses: 0,
  toasts: [],

  setPaused: (paused) => set({ isPaused: paused }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  selectPersona: (personaId) => set({ selectedPersonaId: personaId }),

  incrementPendingResponses: () =>
    set((state) => ({ pendingResponses: state.pendingResponses + 1 })),

  decrementPendingResponses: () =>
    set((state) => ({ pendingResponses: Math.max(0, state.pendingResponses - 1) })),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, toast.duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
