/**
 * Shared State for @slidev/client-react
 * Port of packages/client/state/shared.ts to React
 *
 * This is the presenter/viewer synchronized state
 */

import serverState from 'server-reactive:nav'
import { useSyncExternalStore, useCallback } from 'react'
import { createSyncState } from './syncState'

// ============================================================================
// Types (1:1 from Slidev)
// ============================================================================

export interface SharedState {
  page: number
  clicks: number
  clicksTotal: number

  timer: {
    status: 'stopped' | 'running' | 'paused'
    slides: Record<number, {
      start?: number
      end?: number
    }>
    startedAt: number
    pausedAt: number
  }

  cursor?: {
    x: number
    y: number
  }

  lastUpdate?: {
    id: string
    type: 'presenter' | 'viewer'
    time: number
  }
}

// ============================================================================
// Server State (virtual module in production)
// ============================================================================

// Default client state
const defaultState: SharedState = {
  page: 1,
  clicks: 0,
  clicksTotal: 0,
  timer: {
    status: 'stopped',
    slides: {},
    startedAt: 0,
    pausedAt: 0,
  },
}

// ============================================================================
// Create Shared State Instance
// ============================================================================

const syncState = createSyncState<SharedState>(serverState, defaultState)

// Export the state and functions matching Slidev's API
export const sharedState = {
  get value() {
    return syncState.getSnapshot()
  },
  set value(val: SharedState) {
    // Update each key individually to trigger proper sync
    for (const [key, value] of Object.entries(val)) {
      syncState.patch(key as keyof SharedState, value as SharedState[keyof SharedState])
    }
  },
}

export const initSharedState = syncState.init
export const onPatch = syncState.onPatch
export const onSharedUpdate = syncState.onUpdate
export const patch = syncState.patch

// ============================================================================
// React Hook for Shared State
// ============================================================================

/**
 * React hook to use shared state with useSyncExternalStore
 * Provides reactive access to presenter/viewer synchronized state
 */
export function useSharedState(): [SharedState, {
  patch: <K extends keyof SharedState>(key: K, value: SharedState[K]) => void
  update: (updates: Partial<SharedState>) => void
}] {
  const state = useSyncExternalStore(
    syncState.subscribe,
    syncState.getSnapshot,
    syncState.getSnapshot, // Server snapshot
  )

  const actions = {
    patch: useCallback(<K extends keyof SharedState>(key: K, value: SharedState[K]) => {
      syncState.patch(key, value)
    }, []),
    update: useCallback((updates: Partial<SharedState>) => {
      syncState.onUpdate(updates)
    }, []),
  }

  return [state, actions]
}
