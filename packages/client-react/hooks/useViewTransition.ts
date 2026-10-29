/**
 * View Transition hook for React
 * Port of Vue client composables/useViewTransition.ts
 *
 * Handles View Transitions API for slide navigation.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { configs } from '../env'
import { getSlide } from '../logic/slides'

// Extend document type for View Transitions API
declare global {
  interface Document {
    startViewTransition?: (callback: () => Promise<void> | void) => {
      finished: Promise<void>
      ready: Promise<void>
      updateCallbackDone: Promise<void>
    }
  }
}

export function useViewTransition() {
  const [isViewTransition, setIsViewTransition] = useState(false)
  const location = useLocation()
  const prevLocationRef = useRef(location)
  const viewTransitionFinishRef = useRef<(() => void) | undefined>()
  const viewTransitionAbortRef = useRef<(() => void) | undefined>()

  const supportViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document

  // Handle route changes for view transitions
  const handleRouteChange = useCallback((fromNo: number | undefined, toNo: number | undefined) => {
    if (fromNo === undefined || toNo === undefined || fromNo === toNo) {
      setIsViewTransition(false)
      return false
    }

    const fromMeta = getSlide(fromNo)?.meta
    const toMeta = getSlide(toNo)?.meta
    const transitionType = (fromNo < toNo ? fromMeta?.transition : toMeta?.transition) ?? configs.transition

    if (transitionType !== 'view-transition') {
      setIsViewTransition(false)
      return false
    }

    if (!supportViewTransition) {
      setIsViewTransition(false)
      console.warn('View transition is not supported in your browser, fallback to normal transition.')
      return false
    }

    return true
  }, [supportViewTransition])

  // Watch for route changes
  useEffect(() => {
    const prevLocation = prevLocationRef.current
    prevLocationRef.current = location

    // Extract slide numbers from paths
    const fromMatch = prevLocation.pathname.match(/^\/(\d+)/)
    const toMatch = location.pathname.match(/^\/(\d+)/)
    const fromNo = fromMatch ? parseInt(fromMatch[1], 10) : undefined
    const toNo = toMatch ? parseInt(toMatch[1], 10) : undefined

    if (handleRouteChange(fromNo, toNo)) {
      setIsViewTransition(true)
    }
  }, [location, handleRouteChange])

  // Clean up view transitions
  useEffect(() => {
    return () => {
      viewTransitionFinishRef.current?.()
      viewTransitionAbortRef.current?.()
    }
  }, [])

  /**
   * Start a view transition for navigation
   * Call this before navigation, then call finish() after the DOM has updated
   */
  const startTransition = useCallback(async (callback: () => Promise<void> | void): Promise<void> => {
    if (!supportViewTransition || !document.startViewTransition) {
      await callback()
      return
    }

    const transition = document.startViewTransition(async () => {
      await callback()
    })

    try {
      await transition.finished
    } catch {
      // Transition was skipped or aborted
    }
  }, [supportViewTransition])

  return {
    isViewTransition,
    supportViewTransition,
    startTransition,
  }
}
