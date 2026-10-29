import type { ClicksContext, ClicksElement, ClicksInfo, NormalizedRangeClickValue, NormalizedSingleClickValue, RawAtValue, RawRangeAtValue, RawSingleAtValue } from '@slidev/types'
import { sum } from '@antfu/utils'
import { useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ClicksContextContext, ClicksValueContext } from '../context'

/**
 * Normalize a single "at" value (Vue parity)
 */
export function normalizeSingleAtValue(at: RawSingleAtValue): NormalizedSingleClickValue {
  if (at === false || at === 'false')
    return null
  if (at == null || at === true || at === 'true')
    return '+1'
  if (typeof at === 'string' && '+-'.includes(at[0]))
    return at
  const v = +at
  if (Number.isNaN(v)) {
    console.error(`Invalid "at" prop value: ${at}`)
    return null
  }
  if (v <= 0) {
    console.warn(`[Slidev] "at" prop value must be greater than 0, but got ${at}, has been set to 1`)
    return 1
  }
  return v
}

/**
 * Normalize a range "at" value (Vue parity)
 */
export function normalizeRangeAtValue(at: RawAtValue): NormalizedRangeClickValue {
  if (Array.isArray(at))
    return [normalizeSingleAtValue(at[0])!, normalizeSingleAtValue(at[1])!]
  return null
}

/**
 * Create a clicks context base object
 * React equivalent of Vue's createClicksContextBase (with full parity)
 */
export function createClicksContextBase(
  getCurrent: () => number,
  setCurrent: (v: number) => void,
  clicksStart: number = 0,
  clicksTotal?: number,
): ClicksContext {
  const relativeSizeMap = new Map<ClicksElement, number>()
  const maxMap = new Map<ClicksElement, number>()
  let isMounted = false

  function getTotal() {
    if (clicksTotal != null) return clicksTotal
    if (!isMounted) return 0
    return Math.max(0, ...maxMap.values())
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  const context: ClicksContext = {
    get current() {
      return clamp(getCurrent(), clicksStart, context.total)
    },
    set current(value: number) {
      if (isMounted) {
        setCurrent(clamp(value, clicksStart, context.total))
      } else {
        // context.total not available yet
        setCurrent(value)
      }
    },
    clicksStart,
    get total() {
      return getTotal()
    },
    get relativeSizeMap() {
      if (__DEV__ && isMounted) {
        console.warn('[slidev] ClicksContext: Unexpected access to relativeSizeMap after mounted')
      }
      return relativeSizeMap
    },
    get maxMap() {
      return maxMap
    },
    get currentOffset() {
      // Vue parity: sum of all relative sizes
      return sum(...relativeSizeMap.values())
    },
    get isMounted() {
      return isMounted
    },
    setup() {
      isMounted = true
      // Make sure the query is not greater than the total
      const currentVal = getCurrent()
      setCurrent(clamp(currentVal, clicksStart, context.total))
    },
    calculateSince(rawAt: RawSingleAtValue, size = 1): ClicksInfo | null {
      const at = normalizeSingleAtValue(rawAt)
      if (at == null)
        return null

      let start: number, max: number, delta: number
      if (typeof at === 'string') {
        // Relative click (e.g., '+1', '-1')
        const offset = context.currentOffset
        const value = +at
        start = offset + value
        max = offset + value + size - 1
        delta = value + size - 1
      } else {
        // Absolute click (e.g., 1, 2, 3)
        start = at
        max = at + size - 1
        delta = 0
      }

      return {
        start,
        end: Number.POSITIVE_INFINITY, // Vue parity: end is +Infinity for calculateSince
        max,
        delta,
        // React getters (Vue uses computed refs)
        get currentOffset() {
          return getCurrent() - start
        },
        get isCurrent() {
          return getCurrent() === start
        },
        get isActive() {
          return getCurrent() >= start // Vue parity: only check >= start (end is Infinity)
        },
      } as unknown as ClicksInfo
    },
    calculateRange(rawAt: RawRangeAtValue): ClicksInfo | null {
      const at = normalizeRangeAtValue(rawAt as RawAtValue)
      if (at == null)
        return null

      const [a, b] = at
      let start: number, end: number, delta: number

      if (typeof a === 'string') {
        const offset = context.currentOffset
        start = offset + +a
        delta = +a
      } else {
        start = a
        delta = 0
      }

      if (typeof b === 'string') {
        end = start + +b
        delta += +b
      } else {
        end = b
      }

      return {
        start,
        end,
        max: end,
        delta,
        get currentOffset() {
          return getCurrent() - start
        },
        get isCurrent() {
          return getCurrent() === start
        },
        get isActive() {
          return start <= getCurrent() && getCurrent() < end
        },
      } as unknown as ClicksInfo
    },
    calculate(at: RawAtValue): ClicksInfo | null {
      if (Array.isArray(at))
        return context.calculateRange(at)
      return context.calculateSince(at)
    },
    register(el: ClicksElement, info: Pick<ClicksInfo, 'delta' | 'max'> | null) {
      if (!info)
        return
      if (__DEV__ && isMounted) {
        console.warn('[slidev] ClicksContext: Unexpected register after mounted')
      }
      const { delta, max } = info
      relativeSizeMap.set(el, delta)
      maxMap.set(el, max)
    },
    unregister(el: ClicksElement) {
      relativeSizeMap.delete(el)
      maxMap.delete(el)
    },
  }

  return context
}

// Global __DEV__ declaration for dev warnings
declare const __DEV__: boolean

/**
 * Get the clicks context for the current slide
 */
export function useClicks(): ClicksContext | null {
  return useContext(ClicksContextContext)
}

/**
 * Get the current clicks value (reactive - triggers re-render when clicks change)
 */
export function useClicksValue(): number {
  return useContext(ClicksValueContext)
}

/**
 * Hook that provides reactive clicks state
 * Combines clicksContext (for calculate/register) with reactive clicks value
 */
export function useClicksState() {
  const clicksContext = useContext(ClicksContextContext)
  const clicksValue = useContext(ClicksValueContext)

  return {
    clicksContext,
    current: clicksValue,
  }
}

/**
 * Hook to run an effect when clicks change (Vue watchEffect equivalent)
 * The callback is called immediately and whenever clicks changes
 */
export function useClicksEffect(callback: (clicks: number) => void | (() => void)) {
  const clicksValue = useContext(ClicksValueContext)
  const cleanupRef = useRef<(() => void) | void>()

  useEffect(() => {
    // Run cleanup from previous execution
    if (cleanupRef.current) {
      cleanupRef.current()
    }
    // Run the callback and store cleanup
    cleanupRef.current = callback(clicksValue)

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [clicksValue, callback])
}

/**
 * Hook that calculates click info and provides reactive isActive/isCurrent values
 * This is the React equivalent of Vue's computed refs in ClicksInfo
 */
export function useClicksInfo(at: RawAtValue, size = 1) {
  const clicksContext = useContext(ClicksContextContext)
  const clicksValue = useContext(ClicksValueContext)
  const id = useId()

  // Calculate AND register at COMMIT time (layout effect, pre-paint).
  // Relative values ('+1') resolve against context.currentOffset - the sum
  // of deltas registered so far - so resolution order matters. React layout
  // effects run child-first in tree order, which is exactly Vue's directive
  // mount order, so the delta arithmetic matches the Vue client. Resolving
  // during RENDER instead is racy: a remounting slide renders its new tree
  // (reading currentOffset) BEFORE the old tree's cleanup unregisters, and
  // discarded render attempts (StrictMode/Suspense) leak registrations
  // that were never committed.
  //
  // Until the layout effect fires, `info` is undefined and the element is
  // treated as not-yet-active (correct for clicks=0); the effect's setState
  // re-renders synchronously before paint, so no wrong frame is shown.
  const [info, setInfo] = useState<ClicksInfo | null | undefined>(undefined)
  useLayoutEffect(() => {
    if (!clicksContext) {
      setInfo(null)
      return
    }
    if (at == null) {
      setInfo(null)
      return
    }
    const calculated = Array.isArray(at) ? clicksContext.calculateRange(at) : clicksContext.calculateSince(at, size)
    setInfo(calculated)
    if (calculated)
      clicksContext.register(id, calculated)
    return () => {
      clicksContext.unregister(id)
    }
  }, [clicksContext, at, size, id])
  const baseInfo = info ?? null
  const pending = info === undefined

  // Calculate reactive values based on current clicks
  const isActive = useMemo(() => {
    if (pending) return false // resolution pending - not yet revealed
    if (!baseInfo) return true // Default to visible if no click info
    return clicksValue >= baseInfo.start && clicksValue < baseInfo.end
  }, [pending, baseInfo, clicksValue])

  const isCurrent = useMemo(() => {
    if (!baseInfo) return false
    return clicksValue === baseInfo.start
  }, [baseInfo, clicksValue])

  const currentOffset = useMemo(() => {
    if (!baseInfo) return 0
    return clicksValue - baseInfo.start
  }, [baseInfo, clicksValue])

  return {
    id,
    info: baseInfo,
    start: baseInfo?.start ?? 0,
    end: baseInfo?.end ?? Number.POSITIVE_INFINITY,
    isActive,
    isCurrent,
    currentOffset,
  }
}

/**
 * Hook for components that need click-based visibility (VClick, VSwitch, etc.)
 * Provides everything needed for reactive click-based visibility toggling
 */
export function useClickVisibility(at: RawSingleAtValue = '+1', hide = false, fade = false) {
  const { info, isActive, isCurrent, start, end } = useClicksInfo(at)

  const isVisible = useMemo(() => {
    return hide ? !isActive : isActive
  }, [hide, isActive])

  const isPrior = useMemo(() => {
    return isActive && !isCurrent
  }, [isActive, isCurrent])

  return {
    info,
    start,
    end,
    isActive,
    isCurrent,
    isVisible,
    isPrior,
    hide,
    fade,
  }
}
