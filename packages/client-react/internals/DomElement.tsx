/**
 * DomElement component for React
 * Port of Vue client internals/DomElement.vue
 *
 * Mounts an external DOM element into the React tree.
 */

import { useEffect, useRef } from 'react'

export interface DomElementProps {
  element: HTMLElement
}

export function DomElement({ element }: DomElementProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && element) {
      containerRef.current.appendChild(element)
    }

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }
  }, [element])

  return <div ref={containerRef} />
}
