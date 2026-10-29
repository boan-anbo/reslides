/**
 * Dark mode logic for React
 * Port of Vue client logic/dark.ts
 *
 * Provides reactive dark mode state management.
 */

import { configs } from '../env'

// ============================================================================
// Dark Mode State (module-level singleton)
// ============================================================================

type ColorSchema = 'light' | 'dark' | 'auto'

interface DarkModeState {
  isDark: boolean
  colorSchema: ColorSchema
}

let state: DarkModeState = {
  isDark: false,
  colorSchema: 'auto',
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(fn => fn())
}

export function subscribeToDarkMode(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setDarkModeState(updates: Partial<DarkModeState>) {
  state = { ...state, ...updates }
  if (updates.colorSchema && typeof localStorage !== 'undefined')
    localStorage.setItem('slidev-color-schema', updates.colorSchema)

  // Update document classes
  if (typeof document !== 'undefined') {
    const CSS_DISABLE_TRANS = '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'

    const style = document.createElement('style')
    style.appendChild(document.createTextNode(CSS_DISABLE_TRANS))
    document.head.appendChild(style)

    const html = document.documentElement
    html.classList.toggle('dark', state.isDark)
    html.classList.toggle('light', !state.isDark)

    // Force browser redraw
    // @ts-expect-error unused variable
    const _ = window.getComputedStyle(style).opacity
    document.head.removeChild(style)
  }

  notifyListeners()
}

// Reactive-like accessors for Vue compatibility
export const isDark = {
  get value() {
    if (isColorSchemaConfigured.value) {
      return configs.colorSchema === 'dark'
    }
    return state.colorSchema === 'auto'
      ? preferredDark
      : state.colorSchema === 'dark'
  },
  set value(v: boolean) {
    if (isColorSchemaConfigured.value) return
    const schema = v === preferredDark ? 'auto' : v ? 'dark' : 'light'
    setDarkModeState({ isDark: v, colorSchema: schema })
  },
}

export const isColorSchemaConfigured = {
  get value() {
    return configs.colorSchema !== 'auto'
  },
}

let preferredDark = false

// Initialize from system preference
if (typeof window !== 'undefined') {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  preferredDark = query.matches

  const storedValue = localStorage.getItem('slidev-color-schema')
  if (storedValue === 'auto' || storedValue === 'light' || storedValue === 'dark') {
    state.colorSchema = storedValue
  }

  // Update initial isDark value
  state.isDark = isDark.value

  // Listen for system preference changes
  query.addEventListener('change', (e) => {
    preferredDark = e.matches
    if (state.colorSchema === 'auto') {
      setDarkModeState({ isDark: isDark.value })
    }
  })

  // Apply initial state
  setDarkModeState({ isDark: state.isDark })
}

export function toggleDark() {
  isDark.value = !isDark.value
}
