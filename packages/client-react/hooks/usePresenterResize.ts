import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useEffect, useState } from 'react'

const WIDTH_KEY = 'slidev-presenter-notes-width'
const ROW_KEY = 'slidev-presenter-notes-row-size'
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(min, Math.round(value)), Math.max(min, max))

function readSize(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key) ?? fallback)
    return Number.isFinite(value) ? value : fallback
  }
  catch { return fallback }
}

interface PresenterStyle extends CSSProperties {
  '--slidev-presenter-notes-width': string
  '--slidev-presenter-notes-row-size': string
  '--slidev-presenter-bottom-height': string
}

/** Slidev 52.19.1 presenter geometry and persisted pointer resizing. */
export function usePresenterResize(
  layout: number,
  grid: RefObject<HTMLDivElement>,
  main: RefObject<HTMLDivElement>,
  note: RefObject<HTMLDivElement>,
  bottom: RefObject<HTMLDivElement>,
) {
  const [width, setWidth] = useState(() => readSize(WIDTH_KEY, 360))
  const [row, setRow] = useState(() => readSize(ROW_KEY, 280))
  const [bounds, setBounds] = useState({ width: 0, height: 0, bottom: 0, ratio: window.innerWidth / window.innerHeight })
  const [drag, setDrag] = useState<{ axis: 'width' | 'row', start: number, size: number, direction: number } | null>(null)
  const wide = bounds.ratio >= 1
  const stacked = layout === 1 && bounds.ratio <= 3 / 5
  const notesOnRight = layout === 1 && wide
  const notesOnBottom = layout === 1 && !stacked
  const maxWidth = Math.min(720, bounds.width * 0.7)
  const maxRow = bounds.height * 0.75

  useEffect(() => {
    const measure = () => {
      const rect = grid.current?.getBoundingClientRect()
      if (rect)
        setBounds({ width: rect.width, height: rect.height, bottom: bottom.current?.getBoundingClientRect().height ?? 0, ratio: window.innerWidth / window.innerHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (grid.current) observer.observe(grid.current)
    if (bottom.current) observer.observe(bottom.current)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [grid, bottom, layout])

  useEffect(() => {
    if (!bounds.width || !bounds.height) return
    setWidth(value => clamp(value, 240, maxWidth))
    setRow(value => clamp(value, 160, maxRow))
  }, [bounds.width, bounds.height, maxWidth, maxRow])

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width))
      localStorage.setItem(ROW_KEY, String(row))
    }
    catch { /* Storage may be disabled; resizing remains available. */ }
  }, [width, row])

  useEffect(() => { setDrag(null) }, [layout, wide, stacked])
  useEffect(() => {
    if (!drag) return
    const move = (event: PointerEvent) => {
      const pointer = drag.axis === 'width' ? event.clientX : event.clientY
      const value = drag.size + (pointer - drag.start) * drag.direction
      if (drag.axis === 'width') setWidth(clamp(value, 240, maxWidth))
      else setRow(clamp(value, 160, maxRow))
    }
    const stop = () => setDrag(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
    }
  }, [drag, maxWidth, maxRow])

  const start = (axis: 'width' | 'row') => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stacked || event.button !== 0) return
    event.preventDefault()
    setDrag({
      axis,
      start: axis === 'width' ? event.clientX : event.clientY,
      size: axis === 'width' ? width : (layout === 2 ? main : note).current?.getBoundingClientRect().height ?? row,
      direction: (axis === 'width' ? notesOnRight : notesOnBottom) ? -1 : 1,
    })
  }
  const style: PresenterStyle = {
    '--slidev-presenter-notes-width': `${width}px`,
    '--slidev-presenter-notes-row-size': `${row}px`,
    '--slidev-presenter-bottom-height': `${bounds.bottom}px`,
    userSelect: drag ? 'none' : undefined,
  }
  return { style, stacked, notesOnRight, notesOnBottom, startWidth: start('width'), startRow: start('row') }
}
