import { useEffect, useRef } from 'react'
import { useSlideContext } from '../context'
import { useNav } from './useNav'

/**
 * Check if the current slide is active
 */
export function useIsSlideActive(): boolean {
  const { $page } = useSlideContext()
  const { currentSlideNo } = useNav()
  return $page === currentSlideNo
}

/**
 * Hook that runs callback when slide becomes active
 * React equivalent of Vue's onSlideEnter
 */
export function useSlideEnter(callback: () => void) {
  const isActive = useIsSlideActive()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (isActive) {
      callbackRef.current()
    }
  }, [isActive])
}

/**
 * Hook that runs callback when slide becomes inactive
 * React equivalent of Vue's onSlideLeave
 */
export function useSlideLeave(callback: () => void) {
  const isActive = useIsSlideActive()
  const prevActive = useRef(isActive)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (prevActive.current && !isActive) {
      callbackRef.current()
    }
    prevActive.current = isActive
  }, [isActive])
}
