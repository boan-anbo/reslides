import type { ReactNode } from 'react'
import { Bottom, Rail } from '../utils/page'

/**
 * Cover: top line, large title and subtitle, byline and stepper at the foot.
 *
 * ---
 * layout: cover
 * kicker: Research Presentation · Session I
 * meta: October 2026
 * ---
 * # Before the Spring
 * Subtitle as a paragraph.
 * ::by::
 * Presenter Name · Institution (bottom left)
 * ::right::
 * Replaces the page stepper (bottom right), if needed.
 */
export interface CoverLayoutProps {
  kicker?: ReactNode
  meta?: ReactNode
  stepper?: boolean
  class?: string
  layoutClass?: string
  children?: ReactNode
  slots?: Record<string, ReactNode>
}

export default function CoverLayout({ kicker, meta, stepper = true, class: className, layoutClass, children, slots }: CoverLayoutProps) {
  return (
    <div className={`dh cover ${layoutClass || ''} ${className || ''}`}>
      <Rail kicker={kicker} meta={meta} />
      <div className="main">{slots?.default ?? children}</div>
      <Bottom className="by" foot={slots?.by} right={slots?.right} stepper={stepper} />
    </div>
  )
}
