/**
 * RenderWhen component for React
 * Port of Vue client builtin/RenderWhen.vue
 *
 * Conditionally render content based on render context.
 */

import type { RenderContext } from '@slidev/types'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNav } from '../hooks/useNav'
import { useSlideContext } from '../context'

type Context = 'main' | 'visible' | 'print' | RenderContext

export interface RenderWhenProps {
  context: Context | Context[]
  children?: ReactNode
  fallback?: ReactNode
}

export function RenderWhen({ context, children, fallback }: RenderWhenProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { $renderContext: currentContext } = useSlideContext()
  const { isPrintMode } = useNav()

  // Track visibility for 'visible' context
  const needsDomWrapper = Array.isArray(context)
    ? context.includes('visible')
    : context === 'visible'

  useEffect(() => {
    if (!needsDomWrapper || !targetRef.current)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(targetRef.current)

    return () => {
      observer.disconnect()
    }
  }, [needsDomWrapper])

  function contextMatch(ctx: Context): boolean {
    if (ctx === currentContext)
      return true
    if (ctx === 'main' && (currentContext === 'slide' || currentContext === 'presenter'))
      return true
    if (ctx === 'visible')
      return true
    if (ctx === 'print' && isPrintMode.value)
      return true
    return false
  }

  function conditionsMatch(ctx: Context): boolean {
    if (ctx === 'visible')
      return isVisible
    return true
  }

  const anyContext = Array.isArray(context)
    ? context.some(contextMatch)
    : contextMatch(context)

  const allConditions = Array.isArray(context)
    ? context.every(conditionsMatch)
    : conditionsMatch(context)

  const shouldRender = anyContext && allConditions

  if (needsDomWrapper) {
    return (
      <div ref={targetRef}>
        {shouldRender ? children : fallback}
      </div>
    )
  }

  return <>{shouldRender ? children : fallback}</>
}

export default RenderWhen
