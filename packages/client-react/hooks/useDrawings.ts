/**
 * Drawings hook for React
 * Port of Vue client composables/useDrawings.ts
 *
 * Handles canvas drawing with drauu library.
 *
 * All drawing state (and the drauu instance itself) is a MODULE-LEVEL
 * singleton shared by every consumer - NavControls' pen toggle, the
 * DrawingControls panel and the DrawingLayer canvas must observe the same
 * state. (A previous version cached the first component's hook result and
 * skipped hooks for later callers: no reactivity across components and a
 * rules-of-hooks violation.)
 */

import type { Brush, DrawingMode } from 'drauu'
import { createDrauu } from 'drauu'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { configs } from '../env'
import { getDrawingState, onPatchDrawingState, patchDrawingState, useDrawingState } from '../state/drawings'
import { useNav } from './useNav'

// ============================================================================
// Module store
// ============================================================================

export const brushColors = [
  '#ff595e',
  '#ffca3a',
  '#8ac926',
  '#1982c4',
  '#6a4c93',
  '#ffffff',
  '#000000',
]

interface DrawingsUiState {
  drawingEnabled: boolean
  drawingPinned: boolean
  brush: Brush
  isDrawing: boolean
  canUndo: boolean
  canRedo: boolean
  canClear: boolean
  drawingMode: DrawingMode | 'arrow'
}

const isClient = typeof window !== 'undefined'

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  }
  catch {
    return defaultValue
  }
}

function setStoredValue<T>(key: string, value: T) {
  if (!isClient) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // Ignore storage errors
  }
}

let uiState: DrawingsUiState = {
  drawingEnabled: getStoredValue('slidev-drawing-enabled', false),
  drawingPinned: getStoredValue('slidev-drawing-pinned', false),
  brush: getStoredValue<Brush>('slidev-drawing-brush', {
    color: brushColors[0],
    size: 4,
    mode: 'stylus',
  }),
  isDrawing: false,
  canUndo: false,
  canRedo: false,
  canClear: false,
  drawingMode: 'stylus',
}

const uiListeners = new Set<() => void>()

function setUiState(partial: Partial<DrawingsUiState>) {
  uiState = { ...uiState, ...partial }
  uiListeners.forEach(fn => fn())
}

function subscribeUi(fn: () => void) {
  uiListeners.add(fn)
  return () => uiListeners.delete(fn)
}

// Live nav values for module-level callbacks (refreshed by the hook)
const navSnapshot = { currentSlideNo: 1, isPresenter: false }

function syncUp() {
  return configs.drawings.syncAll || navSnapshot.isPresenter
}

// ============================================================================
// drauu singleton
// ============================================================================

let _drauu: ReturnType<typeof createDrauu> | null = null
let disableDump = false

function getDrauu(): ReturnType<typeof createDrauu> {
  if (_drauu) return _drauu

  const instance = createDrauu({
    brush: uiState.brush,
    coordinateTransform: false,
  })
  _drauu = instance

  instance.on('changed', () => {
    updateState()
    if (!disableDump) {
      const dump = instance.dump()
      const key = navSnapshot.currentSlideNo
      if ((getDrawingState()[key] || '') !== dump && syncUp())
        patchDrawingState(key, dump)
    }
  })
  instance.on('start', () => setUiState({ isDrawing: true }))
  instance.on('end', () => setUiState({ isDrawing: false }))

  // Follow remote/per-slide drawing data
  onPatchDrawingState((state) => {
    disableDump = true
    if (state[navSnapshot.currentSlideNo] != null)
      instance.load(state[navSnapshot.currentSlideNo] || '')
    disableDump = false
    updateState()
  })

  ensureKeyboardShortcuts()
  return instance
}

function updateState() {
  const drauu = _drauu
  if (!drauu) return
  setUiState({
    canRedo: drauu.canRedo(),
    canUndo: drauu.canUndo(),
    canClear: !!drauu.el?.children.length,
  })
}

// ============================================================================
// Actions
// ============================================================================

export function setDrawingEnabled(v: boolean) {
  setUiState({ drawingEnabled: v })
  setStoredValue('slidev-drawing-enabled', v)
}

export function getDrawingEnabled() {
  return uiState.drawingEnabled
}

export function setDrawingPinned(v: boolean) {
  setUiState({ drawingPinned: v })
  setStoredValue('slidev-drawing-pinned', v)
}

export function setBrush(updates: Partial<Brush>) {
  const newBrush = { ...uiState.brush, ...updates }
  setUiState({ brush: newBrush })
  setStoredValue('slidev-drawing-brush', newBrush)
  if (_drauu)
    Object.assign(_drauu.brush, updates)
}

export function setDrawingMode(v: DrawingMode | 'arrow') {
  setUiState({ drawingMode: v })
  const drauu = getDrauu()
  if (v === 'arrow') {
    drauu.mode = 'line'
    setBrush({ arrowEnd: true })
  }
  else {
    drauu.mode = v
    setBrush({ arrowEnd: false })
  }
}

export function clearDrawings() {
  const drauu = _drauu
  if (!drauu) return
  drauu.clear()
  if (syncUp())
    patchDrawingState(navSnapshot.currentSlideNo, '')
}

let lastLoadedNo: number | null = null

export function loadCanvas(page?: number) {
  const drauu = _drauu
  if (!drauu) return
  const no = page ?? navSnapshot.currentSlideNo
  disableDump = true
  const data = getDrawingState()[no]
  if (data != null)
    drauu.load(data)
  else
    drauu.clear()
  updateState()
  disableDump = false
  lastLoadedNo = no
}

// ============================================================================
// Keyboard shortcuts (wired once, like the Vue singleton composable)
// ============================================================================

let shortcutsWired = false

function ensureKeyboardShortcuts() {
  if (shortcutsWired || !isClient) return
  shortcutsWired = true

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!uiState.drawingEnabled) return

    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      return

    const noModifier = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey
    let handled = true

    if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey)
        _drauu?.redo()
      else
        _drauu?.undo()
    }
    else if (e.code === 'Escape') {
      setDrawingEnabled(false)
    }
    else if (e.code === 'KeyL' && noModifier) {
      setDrawingMode('line')
    }
    else if (e.code === 'KeyA' && noModifier) {
      setDrawingMode('arrow')
    }
    else if (e.code === 'KeyS' && noModifier) {
      setDrawingMode('stylus')
    }
    else if (e.code === 'KeyR' && noModifier) {
      setDrawingMode('rectangle')
    }
    else if (e.code === 'KeyE' && noModifier) {
      setDrawingMode('ellipse')
    }
    else if (e.code === 'KeyC' && noModifier) {
      clearDrawings()
    }
    else if (e.code.startsWith('Digit') && noModifier && +e.code[5] <= brushColors.length) {
      setBrush({ color: brushColors[+e.code[5] - 1] })
    }
    else {
      handled = false
    }

    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, false)
}

// ============================================================================
// Hook
// ============================================================================

export interface UseDrawingsResult {
  brush: Brush
  brushColors: string[]
  canClear: boolean
  canRedo: boolean
  canUndo: boolean
  clear: () => void
  drauu: ReturnType<typeof createDrauu>
  drawingEnabled: boolean
  drawingMode: DrawingMode | 'arrow'
  drawingPinned: boolean
  drawingState: Record<number, string | undefined>
  isDrawing: boolean
  loadCanvas: (page?: number) => void
  setDrawingEnabled: (v: boolean) => void
  setDrawingPinned: (v: boolean) => void
  setDrawingMode: (v: DrawingMode | 'arrow') => void
  setBrush: (updates: Partial<Brush>) => void
}

export function useDrawings(): UseDrawingsResult {
  const { currentSlideNo, isPresenter } = useNav()
  navSnapshot.currentSlideNo = currentSlideNo
  navSnapshot.isPresenter = isPresenter

  const state = useSyncExternalStore(subscribeUi, () => uiState, () => uiState)
  const drawingState = useDrawingState()

  // Reload the canvas when the slide changes (guarded so multiple
  // consumers don't trigger redundant loads)
  useEffect(() => {
    if (_drauu?.mounted && lastLoadedNo !== currentSlideNo)
      loadCanvas(currentSlideNo)
  }, [currentSlideNo])

  // Drawing interactivity follows the enabled state (Vue parity:
  // acceptsInputTypes watcher)
  useEffect(() => {
    if (!_drauu) return
    _drauu.options.acceptsInputTypes = state.drawingEnabled && (!configs.drawings.presenterOnly || isPresenter)
      ? undefined
      : ['pen']
  }, [state.drawingEnabled, isPresenter])

  const clear = useCallback(() => clearDrawings(), [])

  return {
    ...state,
    brushColors,
    clear,
    drauu: getDrauu(),
    drawingState,
    loadCanvas,
    setDrawingEnabled,
    setDrawingPinned,
    setDrawingMode,
    setBrush,
  }
}
