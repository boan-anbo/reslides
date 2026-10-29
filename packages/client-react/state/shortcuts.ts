/**
 * Shortcuts state management
 * Ported from apps/slidev-source/packages/client/state/storage.ts
 *
 * Provides reactive state for keyboard shortcuts:
 * - shortcutsEnabled: global toggle
 * - shortcutsLocked: computed from active locks
 * - lockShortcuts(): returns unlock function
 * - isInputting: true when focus is on INPUT/TEXTAREA
 * - isOnFocus: true when focus is on BUTTON/A
 */

// ============================================================================
// Shortcuts Enabled/Locked State
// ============================================================================

let _shortcutsEnabled = true
const shortcutsEnabledListeners = new Set<() => void>()

export function getShortcutsEnabled(): boolean {
  return _shortcutsEnabled
}

export function setShortcutsEnabled(enabled: boolean): void {
  _shortcutsEnabled = enabled
  shortcutsEnabledListeners.forEach(fn => fn())
}

export function subscribeShortcutsEnabled(fn: () => void): () => void {
  shortcutsEnabledListeners.add(fn)
  return () => shortcutsEnabledListeners.delete(fn)
}

// Locking mechanism - supports multiple simultaneous locks
// Race conditions may occur when locking shortcuts on editor focus
// and moving from one editor to another, as blur events can be
// triggered after focus.
const shortcutsLocks = new Set<symbol>()
const shortcutsLockedListeners = new Set<() => void>()

export function getShortcutsLocked(): boolean {
  return shortcutsLocks.size > 0
}

export function subscribeShortcutsLocked(fn: () => void): () => void {
  shortcutsLockedListeners.add(fn)
  return () => shortcutsLockedListeners.delete(fn)
}

/**
 * Lock shortcuts - returns an unlock function
 * Use when focusing editors or other interactive elements
 */
export function lockShortcuts(): () => void {
  const lock = Symbol('shortcuts lock')
  shortcutsLocks.add(lock)
  shortcutsLockedListeners.forEach(fn => fn())
  return () => {
    shortcutsLocks.delete(lock)
    shortcutsLockedListeners.forEach(fn => fn())
  }
}

// ============================================================================
// Active Element Detection
// ============================================================================

/**
 * Check if the active element is an input field
 */
export function isInputting(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tagName = el.tagName.toUpperCase()
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

/**
 * Check if the active element is a button or link
 */
export function isOnFocus(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tagName = el.tagName.toUpperCase()
  return tagName === 'BUTTON' || tagName === 'A'
}

// ============================================================================
// Fullscreen State
// ============================================================================

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement
}
