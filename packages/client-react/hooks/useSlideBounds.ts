/**
 * Slide bounds hook for React
 * Port of Vue client composables/useSlideBounds.ts
 */

import type { RefObject } from 'react'
import { useCallback, useEffect, useState } from 'react'

export interface SlideBounds {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
  update: () => void
}

export function useSlideBounds(slideElement: RefObject<HTMLElement | null>): SlideBounds {
  const [bounds, setBounds] = useState<Omit<SlideBounds, 'update'>>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })

  const update = useCallback(() => {
    const el = slideElement.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    setBounds({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    })
  }, [slideElement])

  // Update on mount and window resize
  useEffect(() => {
    update()

    // Delayed update for layout shifts
    const timeout = setTimeout(update, 300)

    window.addEventListener('resize', update)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', update)
    }
  }, [update])

  return {
    ...bounds,
    update,
  }
}
