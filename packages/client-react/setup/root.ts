/**
 * Root Setup for @slidev/client-react
 * Port of packages/client/setup/root.ts to React
 *
 * This handles initialization of shared state.
 * Cross-window sync is handled by the root useNavSync hook.
 */

import setups from '#slidev/setups/root'
import { useEffect } from 'react'
import { slidesTitle } from '../env'
import { initSharedState, sharedState } from '../state/shared'
import { initDrawingState } from '../state/drawings'

// Channel key based on slides title
const SHARED_STATE_KEY = `${slidesTitle} - shared`

// Flag to track if shared state has been initialized
let isInitialized = false

/**
 * Get the current shared state value
 */
export function getSharedState() {
  return sharedState.value
}

/**
 * Initialize shared state manually (for use outside React components)
 * Should be called once from App.tsx on mount.
 * Cross-window sync (patch/onPatch) is handled by the root useNavSync hook.
 */
export function initializeSharedState() {
  if (!isInitialized) {
    initSharedState(SHARED_STATE_KEY)
    initDrawingState(`${slidesTitle} - drawings`)
    isInitialized = true
  }
}

/** Run root setup effects with React's mount/unmount lifetime. */
export function useRootSetup() {
  useEffect(() => {
    let disposed = false
    const cleanups: (() => void)[] = []
    void (async () => {
      for (const setup of setups) {
        if (disposed) return
        const cleanup = await setup()
        if (cleanup) { if (disposed) cleanup(); else cleanups.push(cleanup) }
      }
    })().catch(error => console.error('[Slidev] Root setup failed', error))
    return () => { disposed = true; cleanups.reverse().forEach(cleanup => cleanup()) }
  }, [])
}
