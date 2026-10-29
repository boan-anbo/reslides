/**
 * Two-cols-header layout for React
 * Port of Vue client layouts/two-cols-header.vue
 *
 * Usage:
 * ```md
 * ---
 * layout: two-cols-header
 * ---
 * This spans both
 * ::left::
 * # Left
 * This shows on the left
 * ::right::
 * # Right
 * This shows on the right
 * ::bottom::
 * This shows at the bottom, aligned to the end (bottom) of the grid
 * ```
 */

import type { ReactNode } from 'react'
import type { LayoutProps } from '../layoutHelper'
import { getSlot } from '../layoutHelper'
import './two-cols-header.css'

export interface TwoColsHeaderLayoutProps extends LayoutProps {
  left?: ReactNode
  right?: ReactNode
  bottom?: ReactNode
}

export default function TwoColsHeaderLayout({
  class: className,
  layoutClass,
  children,
  slots,
  left,
  right,
  bottom,
}: TwoColsHeaderLayoutProps) {
  return (
    <div className={`slidev-layout two-cols-header w-full h-full ${layoutClass || ''}`}>
      <div className="col-header">
        {children}
      </div>
      <div className={`col-left ${className || ''}`}>
        {getSlot(slots, 'left') ?? left}
      </div>
      <div className={`col-right ${className || ''}`}>
        {getSlot(slots, 'right') ?? right}
      </div>
      <div className={`col-bottom ${className || ''}`}>
        {getSlot(slots, 'bottom') ?? bottom}
      </div>
    </div>
  )
}
