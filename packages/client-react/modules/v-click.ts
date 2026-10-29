/**
 * v-click module for React
 * Provides click-based reveal functionality (Vue parity)
 *
 * In Vue, v-click is implemented as a directive.
 * In React, we use hooks that return props/className to apply to elements.
 */

import type { ClicksContext, ClicksElement, ClicksInfo, RawAtValue } from '@slidev/types'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
} from '../constants'
import { useClicks, useClicksValue } from '../hooks/useClicks'

export interface VClickOptions {
  /** Click value (absolute number, relative string like '+1', or range array) */
  at?: RawAtValue
  /** Hide element on click instead of showing */
  hide?: boolean
  /** Use fade animation instead of hide */
  fade?: boolean
}

export interface VClickResult {
  /** Ref to attach to the element */
  ref: React.RefCallback<HTMLElement>
  /** CSS class names to apply */
  className: string
  /** Whether the element is currently active/visible */
  isActive: boolean
  /** Whether this is the current click step */
  isCurrent: boolean
  /** The click info object */
  info: ClicksInfo | null
}

/**
 * Map of elements to their resolved click info
 */
export const resolvedClickMap = new Map<ClicksElement, ResolvedClickInfo>()

interface ResolvedClickInfo extends ClicksInfo {
  flagHide: boolean
  flagFade: boolean
  isShown: boolean
  visibilityState: 'shown' | 'before' | 'after'
}

/**
 * Hook for v-click functionality
 * React equivalent of Vue's v-click directive
 */
export function useVClick(options: VClickOptions = {}): VClickResult {
  const ctx = useClicks()
  const clicksValue = useClicksValue()
  const elementRef = useRef<HTMLElement | null>(null)
  const infoRef = useRef<ClicksInfo | null>(null)

  const { at = '+1', hide = false, fade = false } = options

  // Ref callback to register/unregister element
  const ref = useCallback((el: HTMLElement | null) => {
    // Unregister previous element
    if (elementRef.current && ctx) {
      ctx.unregister(elementRef.current)
      resolvedClickMap.delete(elementRef.current)
    }

    elementRef.current = el

    if (!el || !ctx) {
      infoRef.current = null
      return
    }

    // Calculate click info
    const info = ctx.calculate(at)
    if (!info) {
      infoRef.current = null
      return
    }

    // Register with clicks context
    ctx.register(el, info)
    infoRef.current = info

    // Store resolved info
    const resolved: ResolvedClickInfo = {
      ...info,
      flagHide: hide,
      flagFade: fade,
      get isShown() {
        return hide ? !info.isActive : info.isActive
      },
      get visibilityState() {
        if (this.isShown) return 'shown'
        if (Number.isFinite(info.end)) {
          return ctx.current < info.start ? 'before' : 'after'
        }
        return hide ? 'after' : 'before'
      },
    }
    resolvedClickMap.set(el, resolved)

    // Set data attributes for debugging
    el.dataset.slidevClicksStart = String(info.start)
    if (Number.isFinite(info.end)) {
      el.dataset.slidevClicksEnd = String(info.end)
    }
  }, [ctx, at, hide, fade])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current && ctx) {
        ctx.unregister(elementRef.current)
        resolvedClickMap.delete(elementRef.current)
      }
    }
  }, [ctx])

  // Calculate class names reactively based on clicksValue (no polling)
  const { className, isActive, isCurrent, info } = useMemo(() => {
    // Recalculate info based on current clicks
    const freshInfo = ctx?.calculate(at) ?? null
    const active = freshInfo?.isActive ?? !hide
    const current = freshInfo?.isCurrent ?? false
    const prior = active && !current

    const classNames: string[] = [CLASS_VCLICK_TARGET]

    if (hide) {
      // v-click-hide behavior
      if (active) {
        classNames.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
        classNames.push(CLASS_VCLICK_HIDDEN_EXP)
      }
    } else {
      // v-click behavior (show on click)
      if (!active) {
        classNames.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
      }
    }

    if (current) {
      classNames.push(CLASS_VCLICK_CURRENT)
    }
    if (prior) {
      classNames.push(CLASS_VCLICK_PRIOR)
    }

    return {
      className: classNames.join(' '),
      isActive: active,
      isCurrent: current,
      info: freshInfo,
    }
  }, [ctx, at, hide, fade, clicksValue])

  return {
    ref,
    className,
    isActive,
    isCurrent,
    info,
  }
}

/**
 * Hook for v-after functionality
 * Shows element after the previous click
 */
export function useVAfter(options: Omit<VClickOptions, 'at'> = {}): VClickResult {
  return useVClick({ ...options, at: '+0' })
}

/**
 * Hook for v-click-hide functionality
 * Hides element on click
 */
export function useVClickHide(options: Omit<VClickOptions, 'hide'> = {}): VClickResult {
  return useVClick({ ...options, hide: true })
}

/**
 * Component wrapper for v-click (for use with children)
 */
export interface VClickProps extends VClickOptions {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

// Note: This file provides hooks. Component versions can be created
// in a separate file if needed.
