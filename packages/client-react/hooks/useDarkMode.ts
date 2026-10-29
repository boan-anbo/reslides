import { useCallback, useSyncExternalStore } from 'react'
import { isDark, subscribeToDarkMode, toggleDark } from '../logic/dark'

// ============================================================================
// Hook: useDarkMode
// ============================================================================
//
// Thin React adapter over logic/dark.ts - the single dark-mode store that
// honors configs.colorSchema and the slidev-color-schema localStorage key.
// (A previous version of this hook kept its own duplicate state here, which
// silently disagreed with the store the rest of the client uses.)

export interface UseDarkModeReturn {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

function subscribe(callback: () => void) {
  const unsubscribe = subscribeToDarkMode(callback)
  // Also re-read when the system preference changes in `auto` mode: the
  // store updates synchronously via its own media-query listener, and this
  // extra subscription just guarantees React re-renders afterwards.
  const query = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
  query?.addEventListener('change', callback)
  return () => {
    unsubscribe()
    query?.removeEventListener('change', callback)
  }
}

function getSnapshot() {
  return isDark.value
}

function getServerSnapshot() {
  return false
}

/**
 * Dark mode hook
 * React equivalent of Vue's useDarkMode
 */
export function useDarkMode(): UseDarkModeReturn {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setDark = useCallback((value: boolean) => {
    isDark.value = value
  }, [])

  return {
    isDark: dark,
    toggle: toggleDark,
    setDark,
  }
}
