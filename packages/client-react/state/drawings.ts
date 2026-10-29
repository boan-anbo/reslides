/**
 * Drawings state for React
 * Port of Vue client state/drawings.ts
 *
 * Syncs drawing state with server.
 */

import serverDrawingState from 'server-reactive:drawings?diff'
import { useSyncExternalStore } from 'react'
import { createSyncState } from './syncState'
import { getServerStateSnapshot } from './serverState'

declare const __SLIDEV_FEATURE_DRAWINGS_PERSIST__: boolean

export type DrawingsState = Record<number, string | undefined>

export const {
  init: initDrawingState,
  onPatch: onPatchDrawingState,
  onUpdate: onDrawingUpdate,
  patch: patchDrawingState,
  getSnapshot: getDrawingState,
  subscribe: subscribeDrawings,
} = createSyncState<DrawingsState>(
  serverDrawingState,
  getServerStateSnapshot(serverDrawingState),
  __SLIDEV_FEATURE_DRAWINGS_PERSIST__,
)

export function useDrawingState() {
  return useSyncExternalStore(subscribeDrawings, getDrawingState, getDrawingState)
}
