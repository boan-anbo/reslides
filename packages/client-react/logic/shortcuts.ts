/**
 * Keyboard shortcuts for React Slidev client
 * Ported from apps/slidev-source/packages/client/logic/shortcuts.ts
 *
 * Implements:
 * - Enabled guard: not(isInputting) && not(isOnFocus) && not(isPrintMode) && shortcutsEnabled && not(shortcutsLocked)
 * - shortcut() with autoRepeat timer acceleration
 * - strokeShortcut() for single-press actions
 * - Base shortcuts from setup/shortcuts.ts pattern
 */

import {
  getShortcutsEnabled,
  getShortcutsLocked,
  isInputting,
  isOnFocus,
} from '../state/shortcuts'

import { showGotoDialog, showOverview } from '../state/storage'
import { closeContextMenu } from './contextMenu'
import setupShortcuts from '../setup/shortcuts'
import type { ShortcutOptions } from '../setups'

// Print mode check - will be set by registerShortcuts caller
let isPrintModeGetter: (() => boolean) | null = null

/**
 * Check if shortcuts are currently enabled
 * Matches Vue: and(not(isInputting), not(isOnFocus), not(isPrintMode), shortcutsEnabled, not(shortcutsLocked))
 */
function isEnabled(): boolean {
  if (showOverview.value || showGotoDialog.value) return false
  if (isInputting()) return false
  if (isOnFocus()) return false
  if (isPrintModeGetter?.()) return false
  if (!getShortcutsEnabled()) return false
  if (getShortcutsLocked()) return false
  return true
}

// Track key states for autoRepeat
const keyStates = new Map<string, boolean>()
const repeatTimers = new Map<string, ReturnType<typeof setTimeout>>()
const repeatCounts = new Map<string, number>()

/**
 * Handle shortcut with optional autoRepeat
 * Ported from Vue: accelerating timer (1000ms -> 150ms min)
 */
function handleShortcut(key: string, fn: () => void, autoRepeat: boolean, isKeyDown: boolean) {
  const wasPressed = keyStates.get(key) || false
  keyStates.set(key, isKeyDown)

  // Clear any existing timer
  const existingTimer = repeatTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
    repeatTimers.delete(key)
  }

  if (!isKeyDown) {
    // Key released - reset count
    repeatCounts.set(key, 0)
    return
  }

  if (!isEnabled()) return

  // Key pressed
  if (!wasPressed) {
    // First press - execute immediately
    fn()
    repeatCounts.set(key, 1)
  }

  if (autoRepeat) {
    // Schedule repeat with acceleration
    const count = repeatCounts.get(key) || 0
    const delay = Math.max(1000 - count * 250, 150)

    const timer = setTimeout(() => {
      if (keyStates.get(key) && isEnabled()) {
        fn()
        repeatCounts.set(key, count + 1)
        // Recurse for continued repeat
        handleShortcut(key, fn, true, true)
      }
    }, delay)

    repeatTimers.set(key, timer)
  }
}

/**
 * Register keyboard shortcuts
 * Returns a cleanup function
 */
export function registerShortcuts(options?: { isPrintMode?: () => boolean }): () => void {
  isPrintModeGetter = options?.isPrintMode || null

  const shortcuts = setupShortcuts()
  const matches = (key: ShortcutOptions['key'], event: KeyboardEvent) => {
    if (typeof key === 'function') return key(event)
    const parts = key.toLowerCase().split(/[+_]/)
    const expected = parts.pop()
    const aliases: Record<string, string> = { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown', space: ' ', esc: 'escape' }
    return event.key.toLowerCase() === (aliases[expected ?? ''] ?? expected)
      && event.ctrlKey === parts.some(p => p === 'ctrl' || p === 'control')
      && event.metaKey === parts.some(p => p === 'meta' || p === 'cmd')
      && event.altKey === parts.includes('alt') && event.shiftKey === parts.includes('shift')
  }
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing || e.defaultPrevented) return
    if (e.key === 'Escape') closeContextMenu()
    if (!isEnabled()) return
    shortcuts.forEach((shortcut, index) => {
      if (!shortcut.fn || !matches(shortcut.key, e)) return
      e.preventDefault()
      handleShortcut(`${e.key}:${index}`, shortcut.fn, shortcut.autoRepeat ?? false, true)
    })
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    for (const key of keyStates.keys()) {
      if (!key.startsWith(`${event.key}:`)) continue
      keyStates.delete(key)
      const timer = repeatTimers.get(key)
      if (timer) clearTimeout(timer)
      repeatTimers.delete(key)
      repeatCounts.delete(key)
    }
  }

  const releaseKeys = () => {
    repeatTimers.forEach(timer => clearTimeout(timer))
    repeatTimers.clear()
    keyStates.clear()
    repeatCounts.clear()
  }
  window.addEventListener('blur', releaseKeys)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  return () => {
    window.removeEventListener('blur', releaseKeys)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    // Clear all timers
    repeatTimers.forEach(timer => clearTimeout(timer))
    repeatTimers.clear()
    keyStates.clear()
    repeatCounts.clear()
  }
}

/**
 * Hook to connect nav functions to shortcut events
 */
export function useShortcutNav(nav: {
  next: () => void
  prev: () => void
  nextSlide: () => void
  prevSlide: () => void
  go: (page: number) => void
  goFirst: () => void
  goLast: () => void
}): () => void {

  const handleGo = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'number') nav.go(event.detail) }
  window.addEventListener('slidev:go', handleGo)
  window.addEventListener('slidev:goFirst', nav.goFirst)
  window.addEventListener('slidev:goLast', nav.goLast)
  const handleNext = () => nav.next()
  const handlePrev = () => nav.prev()
  const handleNextSlide = () => nav.nextSlide()
  const handlePrevSlide = () => nav.prevSlide()

  window.addEventListener('slidev:next', handleNext)
  window.addEventListener('slidev:prev', handlePrev)
  window.addEventListener('slidev:nextSlide', handleNextSlide)
  window.addEventListener('slidev:prevSlide', handlePrevSlide)

  return () => {
    window.removeEventListener('slidev:go', handleGo)
    window.removeEventListener('slidev:goFirst', nav.goFirst)
    window.removeEventListener('slidev:goLast', nav.goLast)
    window.removeEventListener('slidev:next', handleNext)
    window.removeEventListener('slidev:prev', handlePrev)
    window.removeEventListener('slidev:nextSlide', handleNextSlide)
    window.removeEventListener('slidev:prevSlide', handlePrevSlide)
  }
}

// Re-export state functions for external use
export { setShortcutsEnabled } from '../state/shortcuts'
export { lockShortcuts } from '../state/shortcuts'
