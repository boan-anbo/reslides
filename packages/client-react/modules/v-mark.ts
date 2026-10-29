/**
 * v-mark module for React
 * Port of Vue client modules/v-mark.ts
 *
 * Provides rough-notation annotations for text elements.
 * In Vue, v-mark is implemented as a directive.
 * In React, we provide a hook that manages annotations.
 */

import type { RoughAnnotation, RoughAnnotationConfig } from '@slidev/rough-notation'
import type { RawAtValue } from '@slidev/types'
import { annotate } from '@slidev/rough-notation'
import { useCallback, useEffect, useRef } from 'react'
import { useNav } from '../hooks/useNav'
import { useClicks, useClicksValue } from '../hooks/useClicks'

export interface RoughDirectiveOptions extends Partial<RoughAnnotationConfig> {
  at?: RawAtValue
}

export type RoughDirectiveValue = RawAtValue | RoughDirectiveOptions

export interface UseVMarkOptions extends Partial<RoughAnnotationConfig> {
  /** Click value to show the annotation */
  at?: RawAtValue
  /** Whether to show immediately (bypassing click animation) */
  immediate?: boolean
}

export interface UseVMarkResult {
  /** Ref to attach to the element */
  ref: React.RefCallback<HTMLElement>
  /** Show the annotation */
  show: () => void
  /** Hide the annotation */
  hide: () => void
  /** Whether the annotation is currently shown */
  isShown: boolean
}

// Modifier definitions
const vMarkModifiers: Record<string, (options: RoughDirectiveOptions, value?: any) => RoughDirectiveOptions> = {
  // Types
  'box': options => Object.assign(options, { type: 'box' }),
  'circle': options => Object.assign(options, { type: 'circle' }),
  'underline': options => Object.assign(options, { type: 'underline' }),
  'highlight': options => Object.assign(options, { type: 'highlight' }),
  'strike-through': options => Object.assign(options, { type: 'strike-through' }),
  'crossed-off': options => Object.assign(options, { type: 'crossed-off' }),
  'bracket': options => Object.assign(options, { type: 'bracket' }),

  // Type Aliases
  'strike': options => Object.assign(options, { type: 'strike-through' }),
  'cross': options => Object.assign(options, { type: 'crossed-off' }),
  'crossed': options => Object.assign(options, { type: 'crossed-off' }),
  'linethrough': options => Object.assign(options, { type: 'strike-through' }),
  'line-through': options => Object.assign(options, { type: 'strike-through' }),

  // Colors (UnoCSS classes)
  'black': options => addClass(options, 'text-black'),
  'blue': options => addClass(options, 'text-blue'),
  'cyan': options => addClass(options, 'text-cyan'),
  'gray': options => addClass(options, 'text-gray'),
  'green': options => addClass(options, 'text-green'),
  'indigo': options => addClass(options, 'text-indigo'),
  'lime': options => addClass(options, 'text-lime'),
  'orange': options => addClass(options, 'text-orange'),
  'pink': options => addClass(options, 'text-pink'),
  'purple': options => addClass(options, 'text-purple'),
  'red': options => addClass(options, 'text-red'),
  'teal': options => addClass(options, 'text-teal'),
  'white': options => addClass(options, 'text-white'),
  'yellow': options => addClass(options, 'text-yellow'),
}

function addClass(options: RoughDirectiveOptions, cls: string) {
  options.class = [options.class, cls].filter(Boolean).join(' ')
  return options
}

/**
 * Hook for v-mark functionality
 * React equivalent of Vue's v-mark directive
 */
export function useVMark(options: UseVMarkOptions = {}): UseVMarkResult {
  const elementRef = useRef<HTMLElement | null>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)
  const { isPrintMode } = useNav()
  const clicksCtx = useClicks()

  const { at, immediate = false, type = 'underline', ...restOptions } = options

  const show = useCallback(() => {
    annotationRef.current?.show()
  }, [])

  const hide = useCallback(() => {
    annotationRef.current?.hide()
  }, [])

  const ref = useCallback((el: HTMLElement | null) => {
    // Cleanup previous annotation
    if (annotationRef.current) {
      annotationRef.current.remove()
      annotationRef.current = null
    }

    elementRef.current = el
    if (!el) return

    // Create annotation
    const config: RoughAnnotationConfig = {
      type,
      ...restOptions,
    }

    // In print mode, use instant animation
    if (isPrintMode) {
      config.animationDuration = 1
    }

    annotationRef.current = annotate(el, config)

    // Show immediately if no click animation
    if (immediate || at === true) {
      annotationRef.current.show()
    }
  }, [type, restOptions, isPrintMode, immediate, at])

  // Use reactive clicks value instead of polling
  const clicksValue = useClicksValue()

  // Handle click-based visibility (reactive via clicksValue)
  useEffect(() => {
    if (!clicksCtx || at === undefined || at === true || immediate) return

    // Recalculate info based on current clicks
    const info = clicksCtx.calculate(at)
    if (!info) return

    if (info.isActive) {
      annotationRef.current?.show()
    } else {
      annotationRef.current?.hide()
    }
  }, [clicksCtx, at, immediate, clicksValue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      annotationRef.current?.remove()
    }
  }, [])

  return {
    ref,
    show,
    hide,
    isShown: annotationRef.current?.isShowing() ?? false,
  }
}

/**
 * Apply modifiers to options (for component usage)
 */
export function applyModifiers(
  options: RoughDirectiveOptions,
  modifiers: Record<string, boolean | string>,
): RoughDirectiveOptions {
  let result = { ...options }

  for (const [key, value] of Object.entries(modifiers)) {
    if (vMarkModifiers[key]) {
      result = vMarkModifiers[key](result, value)
    }
  }

  return result
}

/**
 * Factory for v-mark directive (Vue API compatibility)
 * In React, prefer using the useVMark hook directly
 */
export function createVMarkDirective() {
  console.warn('[Slidev] createVMarkDirective is a Vue API. Use useVMark hook in React.')
  return {
    install() {
      // No-op in React
    },
  }
}
