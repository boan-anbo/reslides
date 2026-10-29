/**
 * @slidev/client-react - React version of Slidev client
 *
 * Public APIs that you might use in your app.
 * Other files are internal and may have breaking changes.
 */

// Hooks (React equivalents of Vue composables)
export { useDarkMode } from './hooks/useDarkMode'
export { useNav } from './hooks/useNav'
export { useSlideContext } from './context'

// Environment and helpers
export * from './env'
export * from './layoutHelper'

// Slide lifecycle hooks
export {
  useIsSlideActive,
  useSlideEnter,
  useSlideLeave,
} from './hooks/useSlides'

// State management
export type { SharedState } from './state/shared'
export { sharedState, useSharedState } from './state/shared'

// Sync state
export {
  addSyncMethod,
  createSyncState,
  disableBuiltinSync,
} from './state/syncState'

// Constants
export * from './constants'

export * from './setups'
