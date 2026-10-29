/**
 * v-drag module for React
 * Port of Vue client modules/v-drag.ts
 *
 * In Vue, v-drag is implemented as a directive.
 * In React, we provide a hook that returns props to make an element draggable.
 */

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { makeId } from '../logic/utils'

export interface DragElementState {
  dragId: string
  container: RefObject<HTMLElement | null>
  containerStyle: React.CSSProperties
  isDragging: boolean
  startDragging: () => void
  stopDragging: () => void
  mounted: () => void
  unmounted: () => void
}

export interface UseDragOptions {
  /** Initial position */
  initialPosition?: { x: number; y: number }
  /** Whether dragging is enabled */
  enabled?: boolean
}

export interface UseDragResult {
  /** Ref to attach to the element */
  ref: React.RefCallback<HTMLElement>
  /** Style to apply to the element */
  style: React.CSSProperties
  /** Whether currently dragging */
  isDragging: boolean
  /** Start dragging (call on dblclick) */
  startDragging: () => void
  /** Stop dragging */
  stopDragging: () => void
  /** The drag ID */
  dragId: string
}

/**
 * Hook for v-drag functionality
 * React equivalent of Vue's v-drag directive
 */
export function useVDrag(options: UseDragOptions = {}): UseDragResult {
  const { initialPosition, enabled = true } = options
  const elementRef = useRef<HTMLElement | null>(null)
  const dragId = useRef(makeId())
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const elementStartRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - startPosRef.current.x
    const dy = e.clientY - startPosRef.current.y
    setPosition({
      x: elementStartRef.current.x + dx,
      y: elementStartRef.current.y + dy,
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const startDragging = useCallback(() => {
    if (!enabled) return
    setIsDragging(true)
  }, [enabled])

  const stopDragging = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const ref = useCallback((el: HTMLElement | null) => {
    elementRef.current = el
    if (el) {
      el.dataset.dragId = dragId.current
    }
  }, [])

  const handleDblClick = useCallback((e: MouseEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY }
    elementStartRef.current = { ...position }
    startDragging()
  }, [position, startDragging])

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    el.addEventListener('dblclick', handleDblClick as any)
    return () => {
      el.removeEventListener('dblclick', handleDblClick as any)
    }
  }, [handleDblClick])

  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: isDragging ? 'none' : undefined,
  }

  return {
    ref,
    style,
    isDragging,
    startDragging,
    stopDragging,
    dragId: dragId.current,
  }
}

/**
 * Factory for v-drag directive (Vue API compatibility)
 * In React, prefer using the useVDrag hook directly
 */
export function createVDragDirective() {
  // In React, directives don't exist.
  // This is a stub for API compatibility.
  // Use useVDrag hook instead.
  console.warn('[Slidev] createVDragDirective is a Vue API. Use useVDrag hook in React.')
  return {
    install() {
      // No-op in React
    },
  }
}
