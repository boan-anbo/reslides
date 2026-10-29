/**
 * Draggable component for React
 * Port of Vue client internals/Draggable.vue
 *
 * Makes child elements draggable with position persistence.
 */

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface DraggableProps {
  storageKey?: string
  initial?: { x: number, y: number }
  children?: ReactNode
}

export function Draggable({
  storageKey,
  initial = { x: 0, y: 0 },
  children,
}: DraggableProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          return JSON.parse(stored) as { x: number, y: number }
        }
        catch {
          // ignore
        }
      }
    }
    return initial
  })

  const [dragging, setDragging] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()

    setDragging(true)
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }, [position])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      }
      setPosition(newPosition)

      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(newPosition))
      }
    }

    const handleMouseUp = () => {
      setDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, storageKey])

  return (
    <div
      ref={elRef}
      className="fixed"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}
