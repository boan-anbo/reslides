import type { LayoutProps } from '../layoutHelper'
import { getSlot } from '../layoutHelper'

/**
 * Two columns layout
 * Usage:
 * ---
 * layout: two-cols
 * ---
 * # Left
 * This shows on the left
 * ::right::
 * # Right
 * This shows on the right
 */
export function TwoColsLayout({
  children,
  slots,
  class: className,
  layoutClass,
}: LayoutProps) {
  return (
    <div className={`slidev-layout two-columns w-full h-full grid grid-cols-2 ${layoutClass || ''}`}>
      <div className={`col-left ${className || ''}`}>
        {getSlot(slots, 'left') ?? children}
      </div>
      <div className={`col-right ${className || ''}`}>
        {getSlot(slots, 'right')}
      </div>
    </div>
  )
}

export default TwoColsLayout
