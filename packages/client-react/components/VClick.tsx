/**
 * VClick component for React
 * Wraps children with click-based reveal functionality
 */

import type { RawAtValue } from '@slidev/types'
import type { CSSProperties, ReactNode } from 'react'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
} from '../constants'
import { useClicks, useClicksValue } from '../hooks/useClicks'

export interface VClickProps {
  /** Click value (absolute number, relative string like '+1', or range array) */
  at?: RawAtValue
  /** Hide element on click instead of showing */
  hide?: boolean
  /** Use fade animation instead of hide */
  fade?: boolean
  /** Children to wrap */
  children: ReactNode
  /** Additional class name */
  className?: string
  /** Additional style */
  style?: CSSProperties
  /** HTML tag to use for wrapper */
  as?: keyof JSX.IntrinsicElements
}

/**
 * VClick component - click-based reveal
 * Equivalent to Vue's v-click directive
 */
export const VClick = forwardRef<HTMLElement, VClickProps>(function VClick(
  { at = '+1', hide = false, fade = false, children, className = '', style, as: Tag = 'span' },
  forwardedRef,
) {
  const ctx = useClicks()
  const elementRef = useRef<HTMLElement | null>(null)
  const infoRef = useRef<ReturnType<NonNullable<typeof ctx>['calculate']>>(null)

  // Combine refs
  const setRef = useCallback((el: HTMLElement | null) => {
    elementRef.current = el
    if (typeof forwardedRef === 'function') {
      forwardedRef(el)
    } else if (forwardedRef) {
      forwardedRef.current = el
    }
  }, [forwardedRef])

  // Use reactive clicks value instead of polling
  const clicksValue = useClicksValue()

  // Register element with clicks context
  useEffect(() => {
    const el = elementRef.current
    if (!el || !ctx) return

    const info = ctx.calculate(at)
    if (!info) return

    ctx.register(el, info)
    infoRef.current = info

    // Set data attributes for debugging
    el.dataset.slidevClicksStart = String(info.start)
    if (Number.isFinite(info.end)) {
      el.dataset.slidevClicksEnd = String(info.end)
    }

    return () => {
      ctx.unregister(el)
      infoRef.current = null
    }
  }, [ctx, at])

  // Calculate visibility classes reactively based on clicksValue (no polling)
  const { classNames, isActive, isCurrent } = useMemo(() => {
    // Recalculate info based on current clicks
    const freshInfo = ctx?.calculate(at) ?? null
    const active = freshInfo?.isActive ?? !hide
    const current = freshInfo?.isCurrent ?? false
    const prior = active && !current

    const classes: string[] = [CLASS_VCLICK_TARGET]

    if (hide) {
      if (active) {
        classes.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
        classes.push(CLASS_VCLICK_HIDDEN_EXP)
      }
    } else {
      if (!active) {
        classes.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
      }
    }

    if (current) {
      classes.push(CLASS_VCLICK_CURRENT)
    }
    if (prior) {
      classes.push(CLASS_VCLICK_PRIOR)
    }

    if (className) {
      classes.push(className)
    }

    return { classNames: classes, isActive: active, isCurrent: current }
  }, [ctx, at, hide, fade, className, clicksValue])

  return React.createElement(
    Tag,
    {
      ref: setRef,
      className: classNames.join(' '),
      style,
    },
    children,
  )
})

/**
 * VAfter component - shows after previous click
 */
export const VAfter = forwardRef<HTMLElement, Omit<VClickProps, 'at'>>(function VAfter(
  props,
  ref,
) {
  return <VClick {...props} at="+0" ref={ref} />
})

/**
 * VClickHide component - hides on click
 */
export const VClickHide = forwardRef<HTMLElement, Omit<VClickProps, 'hide'>>(function VClickHide(
  props,
  ref,
) {
  return <VClick {...props} hide ref={ref} />
})
