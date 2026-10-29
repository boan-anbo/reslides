/**
 * SlidesShow component - renders the current slide
 * Ported from apps/slidev-source/packages/client/internals/SlidesShow.vue
 *
 * Transitions use Vue-compatible CSS classes via useSlideTransition
 * (see packages/client/styles/transitions.css, already loaded in React
 * mode by node/virtual-react/styles.ts).
 */
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useNav } from '../hooks/useNav'
import { useLoadedSlide } from '../hooks/useLoadedSlide'
import { CLICKS_MAX } from '../constants'
import { createClicksContextBase } from '../hooks/useClicks'
import { transitionClasses, useSlideTransition } from '../hooks/useSlideTransition'
import { getCurrentTransition } from '../logic/transition'
import { hmrSkipTransition as hmrSkipTransitionState, disableTransition as disableTransitionState } from '../state/storage'
import { DrawingLayer } from './DrawingLayer'
import SlideWrapper from './SlideWrapper'

declare const __SLIDEV_FEATURE_DRAWINGS__: boolean
declare const __SLIDEV_FEATURE_DRAWINGS_PERSIST__: boolean
// @ts-ignore - Virtual module
import { GlobalBottom, GlobalTop } from '#slidev/global-layers'

const NAV_PENDING_CSS = `
.slidev-nav-pending{position:absolute;inset:0;pointer-events:none;z-index:100;opacity:0;animation:slidev-nav-pending-in .12s ease-out .15s forwards}
.slidev-nav-pending-bar{position:absolute;top:0;left:0;height:3px;width:30%;background:rgba(120,120,130,.75);animation:slidev-nav-pending-run 1s ease-in-out infinite}
.slidev-nav-pending-no{position:absolute;right:14px;bottom:10px;font:600 14px/1 ui-sans-serif,system-ui,sans-serif;color:rgba(90,90,100,.85);background:rgba(255,255,255,.8);border-radius:4px;padding:4px 7px}
@keyframes slidev-nav-pending-in{to{opacity:1}}
@keyframes slidev-nav-pending-run{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}
@media (prefers-reduced-motion: reduce){.slidev-nav-pending-bar{animation:none;width:100%}}
`

interface SlidesShowProps {
  renderContext: 'slide' | 'presenter'
}

export default function SlidesShow({ renderContext }: SlidesShowProps) {
  const {
    currentSlideRoute,
    prevRoute,
    nextRoute,
    slides,
    clicksDirection,
    isPrintMode,
    isPrintWithClicks,
    getPrimaryClicks,
    queryClicks,
  } = useNav()

  const requestedFrame = useMemo(() => ({ route: currentSlideRoute, clicks: queryClicks }), [currentSlideRoute, queryClicks])
  const displayedFrame = useLoadedSlide(requestedFrame)
  const displayedRoute = displayedFrame?.route
  // A key press whose slide is still loading shows a quiet cue after a short
  // delay, so the press is visibly accepted and nobody presses again.
  const pendingNo = displayedRoute && currentSlideRoute && currentSlideRoute !== displayedRoute ? currentSlideRoute.no : null

  // Preload adjacent slides
  useEffect(() => {
    const preloadRoute = (route: typeof currentSlideRoute) => {
      if (route && route.meta?.preload !== false) {
        route.meta.__preloaded = true
        route.load?.()
      }
    }

    preloadRoute(currentSlideRoute)
    preloadRoute(prevRoute)
    preloadRoute(nextRoute)
  }, [currentSlideRoute, prevRoute, nextRoute])

  // Preload every slide soon after the first frame, nearest first and one at a
  // time, so a jump made in the first seconds rarely has to wait on the network.
  useEffect(() => {
    let cancelled = false
    const start = currentSlideRoute?.no ?? 1
    const queue = slides
      .filter(route => route && route.meta?.preload !== false)
      .sort((a, b) => Math.abs(a.no - start) - Math.abs(b.no - start))
    const timeout = setTimeout(async () => {
      for (const route of queue) {
        if (cancelled)
          return
        route.meta.__preloaded = true
        try {
          await route.load?.()
        }
        catch {}
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // Start once per deck; the nearest-first order uses the slide we opened on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides])

  const navClassName = useMemo(() => {
    if (clicksDirection > 0) return 'slidev-nav-go-forward'
    if (clicksDirection < 0) return 'slidev-nav-go-backward'
    return ''
  }, [clicksDirection])

  // Vue: onAfterLeave sets hmrSkipTransition so HMR updates don't animate;
  // nav.go()/setQueryClicks() reset it on real navigation.
  const onAfterLeave = useCallback(() => {
    hmrSkipTransitionState.value = true
  }, [])

  // Resolve the transition per-move: direction is derived from the actual
  // (leaving -> entering) pair, mirroring Vue's currentTransition computed.
  const resolveTransitionName = useCallback((leavingNo: number, enteringNo: number) => {
    const direction = enteringNo - leavingNo
    return getCurrentTransition(
      direction,
      slides[enteringNo - 1],
      slides[enteringNo - 2],
    )?.name
  }, [slides])

  const transitionEnabled
    = !isPrintMode
      && !disableTransitionState.value
  // The hook only animates a ready slide-number change, so same-slide HMR
  // cannot animate. An earlier leave finishing during a slow load must not
  // suppress the pending navigation through hmrSkipTransition.
  const { active: activeTransition, finish: finishTransition } = useSlideTransition(
    displayedRoute?.no,
    resolveTransitionName,
    transitionEnabled,
    onAfterLeave,
  )

  const loadedRoutes = slides.filter(r => r?.meta?.__preloaded
    || r === currentSlideRoute || r === displayedRoute || r.no === activeTransition?.leavingNo)

  // Create fixed clicks context for print mode (matches Vue)
  const createFixedClicks = (route: typeof currentSlideRoute) => {
    return createClicksContextBase(
      () => CLICKS_MAX,
      () => {},
      0,
      CLICKS_MAX,
    )
  }

  return (
    <>
      <GlobalBottom />
      {/* Slides */}
      <div id="slideshow" className={`h-full relative ${navClassName}`}>
        {loadedRoutes.map((route) => {
          // Vue: isPrintMode && !isPrintWithClicks ? createFixedClicks(route, CLICKS_MAX) : getPrimaryClicks(route)
          const clicksContext = isPrintMode && !isPrintWithClicks
            ? createFixedClicks(route)
            : getPrimaryClicks(route)

          // Pass queryClicks only for current slide (others use CLICKS_MAX or 0)
          const clicksValue = displayedFrame && route === displayedFrame.route ? displayedFrame.clicks : (isPrintMode ? CLICKS_MAX : 0)

          const isCurrent = route === displayedRoute
          const isLeaving = activeTransition?.leavingNo === route.no
          const isEntering = activeTransition?.enteringNo === route.no

          return (
            <div
              key={route.no}
              style={{
                display: isCurrent || isLeaving ? 'block' : 'none',
                position: 'absolute',
                inset: 0,
              }}
              className={`h-full ${transitionClasses(activeTransition, route.no)}`}
              onTransitionEnd={isEntering
                ? (e) => {
                    // ignore bubbled transitions from slide content
                    if (e.target === e.currentTarget)
                      finishTransition()
                  }
                : undefined}
            >
              <Suspense fallback={null}>
                <SlideWrapper
                  route={route}
                  renderContext={renderContext}
                  clicksContext={clicksContext}
                  clicks={clicksValue}
                />
              </Suspense>
            </div>
          )
        })}
      </div>
      <GlobalTop />
      {pendingNo != null && renderContext === 'slide' && (
        <div className="slidev-nav-pending" role="status" aria-live="polite" aria-label={`Loading slide ${pendingNo}`}>
          <style>{NAV_PENDING_CSS}</style>
          <div className="slidev-nav-pending-bar" />
          <span className="slidev-nav-pending-no">{pendingNo}</span>
        </div>
      )}
      {/* Vue parity: drawing canvas overlays the slideshow */}
      {(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && ['slide', 'presenter'].includes(renderContext) && (
        <DrawingLayer />
      )}
    </>
  )
}
