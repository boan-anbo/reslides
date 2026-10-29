/**
 * useSlideTransition
 *
 * Vue <TransitionGroup>-compatible slide transition choreography for the
 * React client, reusing the exact CSS classes shipped in
 * packages/client/styles/transitions.css (slide-left, slide-right, fade, ...):
 *
 *   enter: `${name}-enter-from` + `${name}-enter-active`
 *          -> next frame: swap `-enter-from` for `-enter-to`
 *          -> on transitionend/timeout: remove all
 *   leave: `${name}-leave-from` + `${name}-leave-active`
 *          -> next frame: swap `-leave-from` for `-leave-to`
 *          -> on transitionend/timeout: unmount (display: none)
 *
 * Starts only when the displayed slide number changes. Classes are committed
 * before paint, so ready content enters from the start of its CSS transition.
 * Same-slide HMR updates do not animate.
 */
import { useLayoutEffect, useRef, useState } from 'react'

export interface ActiveSlideTransition {
  name: string
  /** slide no of the route animating out */
  leavingNo: number
  /** slide no of the route animating in */
  enteringNo: number
  /** 'from' on first paint, 'to' after the next animation frame */
  stage: 'from' | 'to'
}

/**
 * Fallback in case transitionend never fires (e.g. display:none mid-flight,
 * prefers-reduced-motion). Comfortably above the default
 * --slidev-transition-duration of 0.5s.
 */
const TRANSITION_TIMEOUT_MS = 1500

export interface SlideTransitionControl {
  active: ActiveSlideTransition | null
  /** Call from onTransitionEnd of the entering wrapper. */
  finish: () => void
}

export function useSlideTransition(
  currentNo: number | undefined,
  /**
   * Resolve the transition name for a (leaving -> entering) move.
   * Resolution must happen per-move: the nav-direction state in useNav
   * only updates in an effect AFTER the route-change render, so reading
   * `currentTransition` there yields the previous move's direction.
   */
  resolveTransitionName: (leavingNo: number, enteringNo: number) => string | undefined,
  enabled: boolean,
  onAfterLeave?: () => void,
): SlideTransitionControl {
  const [active, setActive] = useState<ActiveSlideTransition | null>(null)
  const prevNoRef = useRef(currentNo)
  const generationRef = useRef(0)
  const onAfterLeaveRef = useRef(onAfterLeave)
  onAfterLeaveRef.current = onAfterLeave
  const resolveRef = useRef(resolveTransitionName)
  resolveRef.current = resolveTransitionName

  const finishRef = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    const prevNo = prevNoRef.current
    if (prevNo === currentNo) {
      if (!enabled)
        setActive(null)
      return
    }
    prevNoRef.current = currentNo

    // The first ready frame has no outgoing slide to animate.
    if (prevNo == null || currentNo == null)
      return

    // `transition: none` has no CSS, so transitionend never fires; without this
    // the leaving slide stays shown (on top, when going back) until the timeout.
    const transitionName = enabled ? resolveRef.current(prevNo, currentNo) : undefined
    if (!transitionName || transitionName === 'none') {
      setActive(null)
      return
    }

    const generation = ++generationRef.current
    setActive({
      name: transitionName,
      leavingNo: prevNo,
      enteringNo: currentNo,
      stage: 'from',
    })

    const finish = () => {
      if (generationRef.current === generation) {
        setActive(null)
        onAfterLeaveRef.current?.()
      }
    }
    finishRef.current = finish

    // Two rAFs: one for React to commit the `-from` classes, one to ensure
    // the browser painted them before we swap to `-to` (otherwise the CSS
    // transition never fires).
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (generationRef.current === generation)
          setActive(a => (a && a.enteringNo === currentNo ? { ...a, stage: 'to' } : a))
      })
    })

    const timeout = setTimeout(finish, TRANSITION_TIMEOUT_MS)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(timeout)
    }
  }, [currentNo, enabled])

  return {
    active,
    finish: () => finishRef.current(),
  }
}

/** Build the wrapper className for a route during an active transition. */
export function transitionClasses(
  active: ActiveSlideTransition | null,
  routeNo: number,
): string {
  if (!active)
    return ''
  const { name, stage } = active
  if (routeNo === active.enteringNo)
    return `${name}-enter-${stage} ${name}-enter-active`
  if (routeNo === active.leavingNo)
    return `${name}-leave-${stage} ${name}-leave-active`
  return ''
}
