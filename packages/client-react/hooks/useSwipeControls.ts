/**
 * Swipe controls hook for React
 * Port of Vue client composables/useSwipeControls.ts
 *
 * Handles touch swipe gestures for navigation.
 */

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { useNav } from './useNav'

export function useSwipeControls(root: RefObject<HTMLElement | undefined>) {
  const { next, nextSlide, prev, prevSlide } = useNav()
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    currentPosRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeStartRef.current) return
    const touch = e.touches[0]
    currentPosRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!swipeStartRef.current) return

    const start = swipeStartRef.current
    const end = currentPosRef.current

    const distanceX = end.x - start.x
    const distanceY = end.y - start.y
    const absX = Math.abs(distanceX)
    const absY = Math.abs(distanceY)

    // Determine swipe direction based on distance
    if (absX / window.innerWidth > 0.3 || absX > 75) {
      if (distanceX < 0) {
        // Swipe left -> next
        next()
      } else {
        // Swipe right -> prev
        prev()
      }
    } else if (absY / window.innerHeight > 0.4 || absY > 200) {
      if (distanceY > 0) {
        // Swipe down -> prev slide
        prevSlide()
      } else {
        // Swipe up -> next slide
        nextSlide()
      }
    }

    swipeStartRef.current = null
  }, [next, prev, nextSlide, prevSlide])

  useEffect(() => {
    const el = root.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [root, handleTouchStart, handleTouchMove, handleTouchEnd])
}
