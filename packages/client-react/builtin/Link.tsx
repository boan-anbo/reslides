/**
 * Link component for React
 * Port of Vue client builtin/Link.vue
 *
 * Create a link to another slide in the presentation.
 *
 * Usage:
 * <Link to={5}>Go to slide 5</Link>
 * <Link to={5} title="Go to slide 5" />
 */

import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useNav } from '../hooks/useNav'

export interface LinkProps {
  to: number | string
  title?: string
  children?: ReactNode
}

export function Link({ to, title, children }: LinkProps) {
  const { isPrintMode } = useNav()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    (e.target as HTMLElement).blur()
  }

  if (isPrintMode.value) {
    if (title) {
      return <a href={`#${to}`} dangerouslySetInnerHTML={{ __html: title }} />
    }
    return <a href={`#${to}`}>{children}</a>
  }

  if (title) {
    return (
      <RouterLink
        to={String(to)}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: title }}
      />
    )
  }

  return (
    <RouterLink to={String(to)} onClick={handleClick}>
      {children}
    </RouterLink>
  )
}

export default Link
