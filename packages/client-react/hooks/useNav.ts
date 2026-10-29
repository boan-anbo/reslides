import type { ClicksContext, SlideRoute, TocItem } from '@slidev/types'

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean
import type { TransitionGroupProps } from './useTransition'
import type { SlidevRouteMeta } from '../shim'
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clamp } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/utils'
import { CLICKS_MAX, TRUST_ORIGINS } from '../constants'
import { configs, slides } from '../env'
import { getSlide, getSlidePath } from '../logic/slides'
import { getCurrentTransition } from '../logic/transition'
import { createClicksContextBase } from './useClicks'
import { useTocTree } from './useTocTree'
import { onPatch, patch, sharedState } from '../state/shared'
import { hmrSkipTransition, syncDirections } from '../state/storage'

// Helper to get typed meta from SlideRoute
type TypedSlideRoute = SlideRoute & { meta: SlidevRouteMeta }

// ============================================================================
// Types
// ============================================================================

export interface SlidevContextNav {
  slides: SlideRoute[]
  total: number

  currentPath: string
  currentPage: number
  currentSlideNo: number
  currentSlideRoute: SlideRoute
  currentTransition: TransitionGroupProps | undefined
  currentLayout: string

  nextRoute: SlideRoute
  prevRoute: SlideRoute
  hasNext: boolean
  hasPrev: boolean

  clicksContext: ClicksContext
  clicks: number
  clicksStart: number
  clicksTotal: number

  tocTree: TocItem[]
  navDirection: number
  clicksDirection: number

  openInEditor: (url?: string) => Promise<boolean>

  next: () => Promise<void>
  prev: () => Promise<void>
  nextSlide: (lastClicks?: boolean) => Promise<void>
  prevSlide: (lastClicks?: boolean) => Promise<void>
  go: (no: number | string, clicks?: number, force?: boolean) => Promise<void>
  goFirst: () => Promise<void>
  goLast: () => Promise<void>

  enterPresenter: () => void
  exitPresenter: () => void
}

export interface SlidevContextNavState {
  isPrintMode: boolean
  isPrintWithClicks: boolean
  isEmbedded: boolean
  isPlaying: boolean
  isPresenter: boolean
  isNotesViewer: boolean
  isPresenterAvailable: boolean
  hasPrimarySlide: boolean
  currentSlideNo: number
  currentSlideRoute: SlideRoute
  clicksContext: ClicksContext
  queryClicks: number
  setQueryClicks: (clicks: number) => void
  printRange: number[]
  getPrimaryClicks: (route: SlideRoute) => ClicksContext
}

export interface SlidevContextNavFull extends SlidevContextNav, SlidevContextNavState {}

// ============================================================================
// Internal State Store (for useSyncExternalStore)
// ============================================================================

interface NavInternalState {
  navDirection: number
  clicksDirection: number
}

let internalState: NavInternalState = {
  navDirection: 0,
  clicksDirection: 0,
}

// Live nav values shared with route-cached clicks contexts (see
// getPrimaryClicks). Refreshed on every useNavState render.
const navSnapshot: {
  currentSlideNo: number
  queryClicks: number
  setQueryClicks: ((clicks: number) => void) | null
} = {
  currentSlideNo: 1,
  queryClicks: 0,
  setQueryClicks: null,
}

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() {
  return internalState
}

function setNavDirection(dir: number) {
  internalState = { ...internalState, navDirection: dir }
  listeners.forEach(l => l())
}

function setClicksDirection(dir: number) {
  internalState = { ...internalState, clicksDirection: dir }
  listeners.forEach(l => l())
}

// hmrSkipTransition lives in state/storage.ts ONLY. A second copy used to
// live in internalState here: SlidesShow read the storage one (set true
// after every completed transition) while go()/setQueryClicks reset this
// one - so every transition after the first was silently skipped.
function setHmrSkipTransition(skip: boolean) {
  hmrSkipTransition.value = skip
}

// ============================================================================
// Hook: useNavState
// ============================================================================

function useNavState(): SlidevContextNavState {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const isPrintMode = useMemo(() =>
    searchParams.has('print') || location.pathname.startsWith('/export'),
    [searchParams, location.pathname]
  )

  const isPrintWithClicks = searchParams.get('print') === 'clicks'
  const isEmbedded = searchParams.has('embedded')
  const isPlaying = location.pathname === '/' || /^\/\d+$/.test(location.pathname)
  const isPresenter = location.pathname.startsWith('/presenter')
  const isNotesViewer = location.pathname.startsWith('/notes')
  const isPresenterAvailable = useMemo(() =>
    !isPresenter && (!configs.remote || searchParams.get('password') === configs.remote),
    [isPresenter, searchParams]
  )

  // Extract slide number from path
  const pathMatch = location.pathname.match(/\/(?:presenter\/)?(\d+)/)
  const slideNoFromPath = pathMatch ? parseInt(pathMatch[1], 10) : 1
  const hasPrimarySlide = !!pathMatch

  const currentSlideNo = hasPrimarySlide
    ? (getSlide(slideNoFromPath)?.no ?? 1)
    : 1

  const currentSlideRoute = slides[currentSlideNo - 1]

  const printRange = useMemo(() =>
    parseRangeString(slides.length, searchParams.get('range') ?? undefined),
    [searchParams]
  )

  const queryClicksRaw = searchParams.get('clicks') || '0'
  const queryClicks = useMemo(() => {
    const v = parseInt(queryClicksRaw, 10)
    return Number.isNaN(v) ? 0 : v
  }, [queryClicksRaw])

  const setQueryClicks = useCallback((clicks: number) => {
    setHmrSkipTransition(false)
    setSearchParams((prev: URLSearchParams) => {
      const next = new URLSearchParams(prev)
      if (clicks === 0) {
        next.delete('clicks')
      } else {
        next.set('clicks', clicks.toString())
      }
      return next
    })
  }, [setSearchParams])

  // Module-level snapshot of the live nav state. Clicks contexts are cached
  // on route.meta and shared by ALL useNav() callers, so their closures must
  // not capture any single component instance's refs - that instance can go
  // stale or unmount while the context lives on. Every mounted useNavState
  // render refreshes this snapshot (all instances derive identical values
  // from the same URL).
  navSnapshot.queryClicks = queryClicks
  navSnapshot.currentSlideNo = currentSlideNo
  navSnapshot.setQueryClicks = setQueryClicks

  const getPrimaryClicks = useCallback((route: SlideRoute): ClicksContext => {
    // Cache on route.meta (Vue parity: route.meta.__clicksContext). A
    // per-hook cache would give every useNav() caller its OWN context, so
    // clicks registered by the slide (via SlidesShow's context) would be
    // invisible to e.g. Play's next()/prev().
    const meta = route?.meta as (SlidevRouteMeta & { __clicksContext?: ClicksContext }) | undefined
    if (meta?.__clicksContext)
      return meta.__clicksContext

    const thisNo = route.no
    const typedRoute = route as TypedSlideRoute
    const clicksStart = typedRoute.meta?.slide?.frontmatter?.clicksStart ?? 0

    // Read through the module-level snapshot - never a component instance's
    // refs (the context is shared and outlives any single instance).
    const context = createClicksContextBase(
      () => {
        if (navSnapshot.currentSlideNo === thisNo) {
          return Math.max(navSnapshot.queryClicks, clicksStart)
        } else if (navSnapshot.currentSlideNo > thisNo) {
          return CLICKS_MAX
        } else {
          return clicksStart
        }
      },
      (v: number) => {
        if (navSnapshot.currentSlideNo === thisNo) {
          navSnapshot.setQueryClicks?.(v)
        }
      },
      clicksStart,
      typedRoute.meta?.clicks,
    )

    if (route?.meta)
      (route.meta as SlidevRouteMeta & { __clicksContext?: ClicksContext }).__clicksContext = context
    return context
  }, [])

  const clicksContext = getPrimaryClicks(currentSlideRoute)

  return {
    isPrintMode,
    isPrintWithClicks,
    isEmbedded,
    isPlaying,
    isPresenter,
    isNotesViewer,
    isPresenterAvailable,
    hasPrimarySlide,
    currentSlideNo,
    currentSlideRoute,
    clicksContext,
    queryClicks,
    setQueryClicks,
    printRange,
    getPrimaryClicks,
  }
}

// ============================================================================
// Hook: useNavBase
// ============================================================================

function useNavBase(
  currentSlideRoute: SlideRoute,
  clicksContext: ClicksContext,
  queryClicks: number,
  setQueryClicks: (clicks: number) => void,
  isPresenter: boolean,
  isPrint: boolean,
): SlidevContextNav {
  const navigate = useNavigate()
  const { navDirection, clicksDirection } = useSyncExternalStore(subscribe, getSnapshot)

  const total = slides.length

  const currentPath = getSlidePath(currentSlideRoute, isPresenter)
  const currentSlideNo = currentSlideRoute.no
  const typedCurrentRoute = currentSlideRoute as TypedSlideRoute
  const currentLayout = typedCurrentRoute.meta?.layout || (currentSlideNo === 1 ? 'cover' : 'default')

  const clicks = clicksContext.current
  const clicksStart = clicksContext.clicksStart
  const clicksTotal = clicksContext.total

  const nextRoute = slides[Math.min(slides.length, currentSlideNo + 1) - 1]
  const prevRoute = slides[Math.max(1, currentSlideNo - 1) - 1]
  const hasNext = currentSlideNo < slides.length || clicks < clicksTotal
  const hasPrev = currentSlideNo > 1 || clicks > 0

  const currentTransition = useMemo(() =>
    isPrint ? undefined : getCurrentTransition(navDirection, currentSlideRoute, prevRoute),
    [isPrint, navDirection, currentSlideRoute, prevRoute]
  )

  // Track slide changes to update navDirection
  const prevSlideNo = useRef(currentSlideNo)
  useEffect(() => {
    if (prevSlideNo.current !== currentSlideNo) {
      setNavDirection(currentSlideNo - prevSlideNo.current)
      prevSlideNo.current = currentSlideNo
    }
  }, [currentSlideNo])

  const openInEditor = useCallback(async (url?: string) => {
    if (!__DEV__) return false
    if (url == null) {
      const typedRoute = currentSlideRoute as TypedSlideRoute
      const slide = typedRoute?.meta?.slide
      if (!slide) return false
      url = `${slide.filepath}:${slide.start}`
    }
    await fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`)
    return true
  }, [currentSlideRoute])

  const tocTree = useTocTree(slides, currentSlideNo, currentSlideRoute)

  const go = useCallback(async (no: number | string, clicksValue: number = 0, force = false) => {
    setHmrSkipTransition(false)
    const pageChanged = currentSlideNo !== no
    const clicksChanged = clicksValue !== queryClicks
    const targetSlide = getSlide(no)
    const meta = targetSlide?.meta as SlidevRouteMeta | undefined
    const clicksStartVal = meta?.slide?.frontmatter?.clicksStart ?? 0
    const clampedClicks = clamp(clicksValue, clicksStartVal, meta?.__clicksContext?.total ?? CLICKS_MAX)

    if (force || pageChanged || clicksChanged) {
      const path = getSlidePath(no, isPresenter, location.pathname.startsWith('/export'))
      const params = new URLSearchParams(location.search)
      if (clampedClicks === 0) {
        params.delete('clicks')
      } else {
        params.set('clicks', clampedClicks.toString())
      }
      if (location.search.includes('embedded')) {
        params.set('embedded', 'true')
      }
      navigate(`${path}?${params.toString()}`)
    }
  }, [currentSlideNo, queryClicks, isPresenter, navigate])

  // Read clicks state from the live context at CALL time, not via render
  // snapshots: clicksContext.total only becomes correct after the slide
  // mounts and registers its click targets, which does not re-render this
  // hook (Vue's `total` is a reactive computed; React must go through the
  // context object).
  const clicksContextRef = useRef(clicksContext)
  clicksContextRef.current = clicksContext

  const next = useCallback(async () => {
    setClicksDirection(1)
    const ctx = clicksContextRef.current
    if (ctx.total <= ctx.current) {
      if (currentSlideNo < slides.length) {
        await go(currentSlideNo + 1)
      }
    } else {
      setQueryClicks(ctx.current + 1)
    }
  }, [currentSlideNo, go, setQueryClicks])

  const prev = useCallback(async () => {
    setClicksDirection(-1)
    const ctx = clicksContextRef.current
    if (ctx.current <= ctx.clicksStart) {
      if (currentSlideNo > 1) {
        await go(currentSlideNo - 1, isPrint ? 0 : CLICKS_MAX)
      }
    } else {
      setQueryClicks(ctx.current - 1)
    }
  }, [currentSlideNo, isPrint, go, setQueryClicks])

  const nextSlide = useCallback(async (lastClicks = false) => {
    setClicksDirection(1)
    if (currentSlideNo < slides.length) {
      await go(currentSlideNo + 1, lastClicks && !isPrint ? CLICKS_MAX : undefined)
    }
  }, [currentSlideNo, isPrint, go])

  const prevSlide = useCallback(async (lastClicks = false) => {
    setClicksDirection(-1)
    if (currentSlideNo > 1) {
      await go(currentSlideNo - 1, lastClicks && !isPrint ? CLICKS_MAX : undefined)
    }
  }, [currentSlideNo, isPrint, go])

  const goFirst = useCallback(() => go(1), [go])
  const goLast = useCallback(() => go(total), [go, total])

  const enterPresenter = useCallback(() => {
    const params = new URLSearchParams(location.search)
    navigate(`/presenter/${currentSlideNo}?${params.toString()}`)
  }, [currentSlideNo, navigate])

  const exitPresenter = useCallback(() => {
    const params = new URLSearchParams(location.search)
    navigate(`/${currentSlideNo}?${params.toString()}`)
  }, [currentSlideNo, navigate])

  return {
    slides,
    total,
    currentPath,
    currentSlideNo,
    currentPage: currentSlideNo,
    currentSlideRoute,
    currentLayout,
    currentTransition,
    clicksDirection,
    nextRoute,
    prevRoute,
    clicksContext,
    clicks,
    clicksStart,
    clicksTotal,
    hasNext,
    hasPrev,
    tocTree,
    navDirection,
    openInEditor,
    next,
    prev,
    go,
    goLast,
    goFirst,
    nextSlide,
    prevSlide,
    enterPresenter,
    exitPresenter,
  }
}

// ============================================================================
// Hook: useNav (main export)
// ============================================================================

// Unique ID for this window instance
function makeId() {
  return Math.random().toString(36).substring(2, 10)
}

export function useNav(): SlidevContextNavFull {
  const state = useNavState()
  const nav = useNavBase(
    state.currentSlideRoute,
    state.clicksContext,
    state.queryClicks,
    state.setQueryClicks,
    state.isPresenter,
    state.isPrintMode,
  )

  return { ...nav, ...state }
}

/** Root-only synchronization; reading navigation must not install writers. */
export function useNavSync(nav: SlidevContextNavFull): void {
  const navigate = useNavigate()
  const location = useLocation()
  // Unique ID for this window
  const idRef = useRef(`${typeof window !== 'undefined' ? window.location.origin : 'slidev'}_${makeId()}`)
  const syncType = nav.isPresenter ? 'presenter' : 'viewer'

  // Sync shared state when presenter navigates
  useEffect(() => {
    // Consult the per-window sync directions (SyncControls), then the Vue
    // trust rule: viewers may only send from trusted origins
    const directions = syncDirections.value
    const shouldSend = nav.isPresenter
      ? directions.presenterSend
      : directions.viewerSend && TRUST_ORIGINS.includes(window.location.hostname)

    if (!shouldSend) return
    if (nav.isNotesViewer || nav.isPrintMode) return

    // A received navigation is already in the shared store. Do not echo it
    // back under this window's role; a subsequent local move must still send.
    const incoming = sharedState.value
    if (incoming.page === nav.currentSlideNo && incoming.clicks === nav.clicks) {
      if (incoming.clicksTotal !== nav.clicksTotal) patch('clicksTotal', nav.clicksTotal)
      return
    }

    // Patch shared state with current navigation
    patch('page', nav.currentSlideNo)
    patch('clicks', nav.clicks)
    patch('clicksTotal', nav.clicksTotal)
    patch('lastUpdate', {
      id: idRef.current,
      type: syncType,
      time: Date.now(),
    })
  }, [nav.currentSlideNo, nav.clicks, nav.clicksTotal, nav.isPresenter, nav.isNotesViewer, nav.isPrintMode, syncType])

  // Use refs for values accessed in onPatch callback to avoid re-registering
  const navRef = useRef({ currentSlideNo: nav.currentSlideNo, clicks: nav.clicks })
  const stateRef = useRef({ isPresenter: nav.isPresenter, hasPrimarySlide: nav.hasPrimarySlide, isPrintMode: nav.isPrintMode })
  const searchRef = useRef(location.search)

  // Keep refs updated
  useEffect(() => {
    navRef.current = { currentSlideNo: nav.currentSlideNo, clicks: nav.clicks }
  }, [nav.currentSlideNo, nav.clicks])

  useEffect(() => {
    stateRef.current = { isPresenter: nav.isPresenter, hasPrimarySlide: nav.hasPrimarySlide, isPrintMode: nav.isPrintMode }
  }, [nav.isPresenter, nav.hasPrimarySlide, nav.isPrintMode])

  useEffect(() => {
    searchRef.current = location.search
  }, [location.search])

  // Listen for shared state patches from other windows (register once)
  useEffect(() => {
    const unsubscribe = onPatch((patchedState) => {
      const { isPresenter, hasPrimarySlide, isPrintMode } = stateRef.current
      const { currentSlideNo, clicks } = navRef.current

      // Consult the per-window sync directions (SyncControls)
      const directions = syncDirections.value
      const shouldReceive = isPresenter
        ? directions.presenterReceive
        : directions.viewerReceive

      if (!shouldReceive) return
      if (!hasPrimarySlide || isPrintMode) return

      // Skip if this update is from the same type (presenter vs viewer)
      const currentSyncType = isPresenter ? 'presenter' : 'viewer'
      if (patchedState.lastUpdate?.type === currentSyncType) return

      // Skip if already at the same position
      if (patchedState.page === currentSlideNo && patchedState.clicks === clicks) return

      // Navigate to synced position
      setHmrSkipTransition(false)
      const path = getSlidePath(patchedState.page, isPresenter)
      const params = new URLSearchParams(searchRef.current)
      if (patchedState.clicks) {
        params.set('clicks', String(patchedState.clicks))
      } else {
        params.delete('clicks')
      }
      navigate(`${path}?${params.toString()}`, { replace: true })
    })

    return unsubscribe
  }, [navigate]) // navigate is stable from react-router

}

// ============================================================================
// Hook: useFixedNav (for static contexts)
// ============================================================================

export function useFixedNav(
  currentSlideRoute: SlideRoute,
  clicksContext: ClicksContext,
): SlidevContextNav {
  const noop = async () => {}

  return {
    ...useNavBase(
      currentSlideRoute,
      clicksContext,
      CLICKS_MAX,
      () => {},
      false,
      false,
    ),
    next: noop,
    prev: noop,
    nextSlide: noop,
    prevSlide: noop,
    goFirst: noop,
    goLast: noop,
    go: noop,
  }
}

