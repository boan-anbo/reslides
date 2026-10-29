/**
 * Badge component for React
 * Port of Vue client internals/Badge.vue
 */

import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useMemo } from 'react'
import { getHashColorFromString, getHsla } from '../logic/color'

export interface BadgeProps {
  text?: string
  color?: boolean | number
  as?: ElementType
  size?: 'sm'
  children?: ReactNode
}

export function Badge({
  text,
  color = true,
  as: Component = 'span',
  size = 'sm',
  children,
}: BadgeProps) {
  const style = useMemo((): CSSProperties => {
    if (!text || color === false) {
      return {}
    }
    return {
      color: typeof color === 'number'
        ? getHsla(color)
        : getHashColorFromString(text),
      background: typeof color === 'number'
        ? getHsla(color, 0.1)
        : getHashColorFromString(text, 0.1),
    }
  }, [text, color])

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'px-1.5 text-11px leading-1.6em'
      default:
        return ''
    }
  }, [size])

  return (
    <Component
      className={`whitespace-nowrap rounded ${sizeClasses}`}
      style={style}
    >
      {children ?? <span>{text}</span>}
    </Component>
  )
}
