/**
 * Transform component for React
 * Port of Vue client builtin/Transform.vue
 *
 * Apply scaling or transforming to elements.
 *
 * Usage:
 * <Transform scale={0.5}>
 *   <YourElements />
 * </Transform>
 */

import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'

export interface TransformProps {
  scale?: number | string
  origin?: string
  children?: ReactNode
}

export function Transform({ scale, origin = 'top left', children }: TransformProps) {
  const style = useMemo<CSSProperties>(() => {
    const transforms: string[] = []
    if (scale != null) {
      transforms.push(`scale(${scale || 1})`)
    }

    return {
      transform: transforms.join(' '),
      transformOrigin: origin,
    }
  }, [scale, origin])

  return (
    <div style={style}>
      {children}
    </div>
  )
}

export default Transform
