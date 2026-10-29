/**
 * State exports for @slidev/client-react
 */

export {
  createSyncState,
  addSyncMethod,
  disableBuiltinSync,
  type Sync,
  type SyncWrite,
  type SyncStateResult,
} from './syncState'

export {
  sharedState,
  initSharedState,
  onPatch,
  onSharedUpdate,
  patch,
  useSharedState,
  type SharedState,
} from './shared'

export {
  getShortcutsEnabled,
  setShortcutsEnabled,
  getShortcutsLocked,
  lockShortcuts,
  isInputting,
  isOnFocus,
  toggleFullscreen,
  isFullscreen,
} from './shortcuts'

// Vue parity: state/index.ts re-exports the storage-backed state. Several
// modules import from '../state' (recording.ts: currentCamera/currentMic,
// VSwitch: hmrSkipTransition) - without this they only worked as long as
// nothing actually loaded them.
export * from './storage'
