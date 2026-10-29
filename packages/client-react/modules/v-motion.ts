/**
 * v-motion module for React
 * Port of Vue client modules/v-motion.ts
 *
 * Provides motion animations for elements.
 * In Vue, v-motion uses @vueuse/motion directive.
 * In React, we provide a hook using framer-motion or CSS animations.
 */

import type { ClicksInfo, RawAtValue } from '@slidev/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNav } from '../hooks/useNav'
import { useClicks, useClicksValue } from '../hooks/useClicks'
import { makeId } from '../logic/utils'
import { resolvedClickMap } from './v-click'

export interface MotionVariant {
  [key: string]: string | number | undefined
  opacity?: number
  x?: number
  y?: number
  scale?: number
  rotate?: number
  transition?: string
}

export interface UseVMotionOptions {
  /** Initial state */
  initial?: MotionVariant
  /** Enter state (shown) */
  enter?: MotionVariant
  /** Leave state (hidden) */
  leave?: MotionVariant
  /** Custom variants */
  variants?: {
    'slidev-initial'?: MotionVariant
    'slidev-enter'?: MotionVariant
    'slidev-leave'?: MotionVariant
    [key: string]: MotionVariant | undefined
  }
  /** Click-based variants: { 'click-1': {...}, 'click-2-3': {...} } */
  clickVariants?: Record<string, MotionVariant>
}

export interface UseVMotionResult {
  /** Ref to attach to the element */
  ref: React.RefCallback<HTMLElement>
  /** Current style to apply */
  style: React.CSSProperties
  /** Apply a variant */
  apply: (variant: MotionVariant) => void
  /** Set a variant instantly (no transition) */
  set: (variant: MotionVariant) => void
  /** The motion instance ID */
  motionId: string
}

/**
 * Convert motion variant to CSS style
 */
function variantToStyle(variant: MotionVariant): React.CSSProperties {
  const style: React.CSSProperties = {}

  if (variant.opacity !== undefined) {
    style.opacity = variant.opacity
  }

  const transforms: string[] = []
  if (variant.x !== undefined) {
    transforms.push(`translateX(${variant.x}px)`)
  }
  if (variant.y !== undefined) {
    transforms.push(`translateY(${variant.y}px)`)
  }
  if (variant.scale !== undefined) {
    transforms.push(`scale(${variant.scale})`)
  }
  if (variant.rotate !== undefined) {
    transforms.push(`rotate(${variant.rotate}deg)`)
  }
  if (transforms.length > 0) {
    style.transform = transforms.join(' ')
  }

  if (variant.transition) {
    style.transition = variant.transition
  }

  return style
}

/**
 * Merge multiple variants
 */
function mergeVariants(...variants: (MotionVariant | undefined)[]): MotionVariant {
  const result: MotionVariant = {}
  for (const v of variants) {
    if (v) {
      Object.assign(result, v)
    }
  }
  return result
}

/**
 * Hook for v-motion functionality
 * React equivalent of Vue's v-motion directive
 */
export function useVMotion(options: UseVMotionOptions = {}): UseVMotionResult {
  const elementRef = useRef<HTMLElement | null>(null)
  const motionId = useRef(makeId())
  const { currentPage, isPrintMode } = useNav()
  const clicksCtx = useClicks()

  const {
    initial: propInitial,
    enter: propEnter,
    leave: propLeave,
    variants = {},
    clickVariants = {},
  } = options

  // Merge variant sources
  const variantInitial = mergeVariants(propInitial, variants['slidev-initial'])
  const variantEnter = mergeVariants(propEnter, variants['slidev-enter'])
  const variantLeave = mergeVariants(propLeave, variants['slidev-leave'])

  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({
    transition: 'all 0.3s ease',
    ...variantToStyle(variantInitial),
  })

  // Parse click variants
  const clickSteps = useRef<{
    id: string
    at: number | [number, number]
    variant: MotionVariant
    info: ClicksInfo | null
  }[]>([])

  useEffect(() => {
    clickSteps.current = []
    const idPrefix = `${motionId.current}-`

    for (const [key, variant] of Object.entries(clickVariants)) {
      if (key.startsWith('click-')) {
        const s = key.slice(6)
        const at = s.includes('-')
          ? (s.split('-').map(Number) as [number, number])
          : +s
        const id = idPrefix + s
        const info = clicksCtx?.calculate(at) ?? null
        clickSteps.current.push({ id, at, variant, info })
      }
    }

    // Sort by click number
    clickSteps.current.sort((a, b) => {
      const aStart = Array.isArray(a.at) ? a.at[0] : a.at
      const bStart = Array.isArray(b.at) ? b.at[0] : b.at
      return aStart - bStart
    })
  }, [clickVariants, clicksCtx])

  const apply = useCallback((variant: MotionVariant) => {
    setCurrentStyle(prev => ({
      ...prev,
      transition: 'all 0.3s ease',
      ...variantToStyle(variant),
    }))
  }, [])

  const set = useCallback((variant: MotionVariant) => {
    setCurrentStyle(prev => ({
      ...prev,
      transition: 'none',
      ...variantToStyle(variant),
    }))
  }, [])

  // Use reactive clicks value instead of polling
  const clicksValue = useClicksValue()

  // Update based on visibility and clicks (reactive via clicksValue)
  useEffect(() => {
    if (!elementRef.current) return

    const el = elementRef.current
    const visibility = resolvedClickMap.get(el)?.visibilityState ?? 'shown'

    if (!clicksCtx) {
      // No clicks context - show fully entered with all click variants applied
      const mixedVariant = mergeVariants(
        variantInitial,
        variantEnter,
        ...clickSteps.current.map(c => c.variant),
      )
      set(mixedVariant)
      return
    }

    if (isPrintMode) {
      // Print mode - show fully entered with active click variants
      const activeVariants = clickSteps.current
        .filter(c => {
          // Recalculate info for fresh isActive based on current clicks
          const freshInfo = clicksCtx.calculate(c.at)
          return !freshInfo || freshInfo.isActive
        })
        .map(c => c.variant)
      const mixedVariant = mergeVariants(variantInitial, variantEnter, ...activeVariants)
      set(mixedVariant)
      return
    }

    if (visibility === 'shown') {
      // Currently visible - apply active click variants (recalculate for fresh values)
      const activeVariants = clickSteps.current
        .filter(c => {
          const freshInfo = clicksCtx.calculate(c.at)
          return !freshInfo || freshInfo.isActive
        })
        .map(c => c.variant)
      const mixedVariant = mergeVariants(variantInitial, variantEnter, ...activeVariants)
      apply(mixedVariant)
    } else {
      // Hidden - apply initial or leave variant
      apply(visibility === 'before' ? variantInitial : variantLeave)
    }
  }, [clicksCtx, isPrintMode, variantInitial, variantEnter, variantLeave, apply, set, clicksValue])

  const ref = useCallback((el: HTMLElement | null) => {
    elementRef.current = el
    if (el) {
      el.dataset.motionId = motionId.current
    }
  }, [])

  return {
    ref,
    style: currentStyle,
    apply,
    set,
    motionId: motionId.current,
  }
}

/**
 * Factory for v-motion directives (Vue API compatibility)
 * In React, prefer using the useVMotion hook directly
 */
export function createVMotionDirectives() {
  console.warn('[Slidev] createVMotionDirectives is a Vue API. Use useVMotion hook in React.')
  return {
    install() {
      // No-op in React
    },
  }
}
