/**
 * IconButton component for React
 * Port of Vue client internals/IconButton.vue
 */

import type { ElementType, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface IconButtonProps {
  title: string
  icon?: string
  as?: ElementType
  to?: string
  children?: ReactNode
  onClick?: () => void
  className?: string
}

export function IconButton({
  title,
  icon,
  as,
  to,
  children,
  onClick,
  className = '',
}: IconButtonProps) {
  const Component = as || (to ? Link : 'button')

  const linkProps = to ? { to } : {}
  const buttonProps = !to ? { type: 'button' as const, onClick } : {}

  return (
    <Component
      className={`slidev-icon-btn ${className}`}
      title={title}
      {...linkProps}
      {...buttonProps}
    >
      <span className="sr-only">{title}</span>
      {children ?? (icon && <div className={icon} />)}
    </Component>
  )
}
