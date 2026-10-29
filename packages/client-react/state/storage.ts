/**
 * Storage state for React
 * Port of Vue client state/storage.ts
 *
 * Client-side storage and global UI state.
 */

import type { DragElementState } from '../hooks/useDragElements'
import { slideAspect } from '../env'

const isClient = typeof window !== 'undefined'

// Dialog visibility state
let _showRecordingDialog = false
let _showInfoDialog = false
let _showGotoDialog = false
let _showOverview = false

// Transition state
let _hmrSkipTransition = false
let _disableTransition = false

// Shortcuts state
let _shortcutsEnabled = true
const shortcutsLocks = new Set<symbol>()

// Active drag element
let _activeDragElement: DragElementState | null = null

// State change listeners
const storageListeners = new Set<() => void>()

function notify() {
  storageListeners.forEach(fn => fn())
}

export function subscribeStorage(fn: () => void): () => void {
  storageListeners.add(fn)
  return () => storageListeners.delete(fn)
}

// Dialog state getters/setters
export const showRecordingDialog = {
  get value() { return _showRecordingDialog },
  set value(v: boolean) { _showRecordingDialog = v; notify() },
}

export const showInfoDialog = {
  get value() { return _showInfoDialog },
  set value(v: boolean) { _showInfoDialog = v; notify() },
}

export const showGotoDialog = {
  get value() { return _showGotoDialog },
  set value(v: boolean) { _showGotoDialog = v; notify() },
}

export const showOverview = {
  get value() { return _showOverview },
  set value(v: boolean) { _showOverview = v; notify() },
}

export const hmrSkipTransition = {
  get value() { return _hmrSkipTransition },
  set value(v: boolean) { _hmrSkipTransition = v; notify() },
}

export const disableTransition = {
  get value() { return _disableTransition },
  set value(v: boolean) { _disableTransition = v; notify() },
}

export const shortcutsEnabled = {
  get value() { return _shortcutsEnabled },
  set value(v: boolean) { _shortcutsEnabled = v; notify() },
}

export const shortcutsLocked = {
  get value() { return shortcutsLocks.size > 0 },
}

export function lockShortcuts() {
  const lock = Symbol('shortcuts lock')
  shortcutsLocks.add(lock)
  notify()
  return () => {
    shortcutsLocks.delete(lock)
    notify()
  }
}

// Window and screen state
function getWindowSize() {
  if (!isClient) return { width: 1920, height: 1080 }
  return { width: window.innerWidth, height: window.innerHeight }
}

let _windowSize = getWindowSize()

export const windowSize = {
  get width() { return _windowSize.width },
  get height() { return _windowSize.height },
}

if (isClient) {
  window.addEventListener('resize', () => {
    _windowSize = getWindowSize()
    notify()
  })
}

export const isScreenVertical = {
  get value() {
    return _windowSize.height - _windowSize.width / slideAspect > 120
  },
}

// Fullscreen
let _isFullscreen = false

export const fullscreen = {
  get isFullscreen() { return _isFullscreen },
  async enter() {
    if (isClient && document.body.requestFullscreen) {
      await document.body.requestFullscreen()
      _isFullscreen = true
      notify()
    }
  },
  async exit() {
    if (isClient && document.exitFullscreen) {
      await document.exitFullscreen()
      _isFullscreen = false
      notify()
    }
  },
  async toggle() {
    if (_isFullscreen) await fullscreen.exit()
    else await fullscreen.enter()
  },
}

if (isClient) {
  document.addEventListener('fullscreenchange', () => {
    _isFullscreen = !!document.fullscreenElement
    notify()
  })
}

// Active element detection
export const isInputting = {
  get value() {
    if (!isClient) return false
    const el = document.activeElement
    return ['INPUT', 'TEXTAREA'].includes(el?.tagName || '')
  },
}

export const isOnFocus = {
  get value() {
    if (!isClient) return false
    const el = document.activeElement
    return ['BUTTON', 'A'].includes(el?.tagName || '')
  },
}

// LocalStorage backed state
function createLocalStorageState<T>(key: string, defaultValue: T) {
  let _value = defaultValue
  if (isClient) {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      try {
        _value = JSON.parse(stored)
      }
      catch {
        _value = defaultValue
      }
    }
  }
  return {
    get value() { return _value },
    set value(v: T) {
      _value = v
      if (isClient) {
        localStorage.setItem(key, JSON.stringify(v))
      }
      notify()
    },
  }
}

export const currentCamera = createLocalStorageState<string>('slidev-camera', 'default')
export const currentMic = createLocalStorageState<string>('slidev-mic', 'default')
export const slideScale = createLocalStorageState<number>('slidev-scale', 0)
export const wakeLockEnabled = createLocalStorageState('slidev-wake-lock', true)
export const hideCursorIdle = createLocalStorageState('slidev-hide-cursor-idle', true)
export const skipExportPdfTip = createLocalStorageState('slidev-skip-export-pdf-tip', false)
export const captureDelay = createLocalStorageState('slidev-export-capture-delay', 400)

export const showPresenterCursor = createLocalStorageState('slidev-presenter-cursor', true)
export const showEditor = createLocalStorageState('slidev-show-editor', false)
export const isEditorVertical = createLocalStorageState('slidev-editor-vertical', false)
export const editorWidth = createLocalStorageState('slidev-editor-width', isClient ? window.innerWidth * 0.4 : 318)
export const editorHeight = createLocalStorageState('slidev-editor-height', isClient ? window.innerHeight * 0.4 : 300)

export const activeDragElement = {
  get value() { return _activeDragElement },
  set value(v: DragElementState | null) { _activeDragElement = v; notify() },
}

export const presenterNotesFontSize = createLocalStorageState('slidev-presenter-font-size', 1)
export const presenterLayout = createLocalStorageState('slidev-presenter-layout', 1)

export const viewerCssFilterDefaults = {
  invert: false,
  contrast: 1,
  brightness: 1,
  hueRotate: 0,
  saturate: 1,
  sepia: 0,
}

export const viewerCssFilter = createLocalStorageState(
  'slidev-viewer-css-filter',
  { ...viewerCssFilterDefaults },
)

export const hasViewerCssFilter = {
  get value() {
    return (Object.keys(viewerCssFilterDefaults) as (keyof typeof viewerCssFilterDefaults)[])
      .some(k => viewerCssFilter.value[k] !== viewerCssFilterDefaults[k])
  },
}

export function togglePresenterLayout() {
  presenterLayout.value = presenterLayout.value + 1
  if (presenterLayout.value > 3)
    presenterLayout.value = 1
}

export function increasePresenterFontSize() {
  presenterNotesFontSize.value = Math.min(2, presenterNotesFontSize.value + 0.1)
}

export function decreasePresenterFontSize() {
  presenterNotesFontSize.value = Math.max(0.5, presenterNotesFontSize.value - 0.1)
}

export function toggleOverview() {
  showOverview.value = !showOverview.value
}

export const syncDirections = createLocalStorageState(
  'slidev-sync-directions',
  {
    viewerSend: true,
    viewerReceive: true,
    presenterSend: true,
    presenterReceive: true,
  },
)
