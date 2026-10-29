/**
 * ShadowRoot component for React
 * Port of Vue client internals/ShadowRoot.vue
 */

import { useCallback, useEffect, useRef } from 'react'

export interface ShadowRootProps {
  innerHTML: string
  className?: string
  onShadow?: (shadow: ShadowRoot) => void
}

export function ShadowRoot({ innerHTML: innerHtml, className, onShadow }: ShadowRootProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)

  const getShadow = useCallback(() => {
    if (!elRef.current) return null
    if (!shadowRef.current) {
      shadowRef.current = elRef.current.shadowRoot || elRef.current.attachShadow({ mode: 'open' })
    }
    return shadowRef.current
  }, [])

  useEffect(() => {
    const shadow = getShadow()
    if (shadow && innerHtml) {
      onShadow?.(shadow)
      shadow.innerHTML = innerHtml
    }
  }, [innerHtml, onShadow, getShadow])

  return <div ref={elRef} className={className} />
}
