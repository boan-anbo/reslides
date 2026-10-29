import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Bottom, numberStyle, Rail, StepsProvider, useFit, usePageNo, useSteps } from '../utils/page'

/**
 * Exhibit page: top line, numbered claim title, content, then source line and stepper at the bottom.
 *
 * ---
 * kicker: Beijing · 8 July 1981   # top-left label (optional)
 * number: false                   # hide the grey number before the h1 (default: shown)
 * stepper: false                  # hide the page stepper at bottom right (default: shown)
 * fit: false                      # don't enlarge a short body to the free space (default: up to 1.35×; a number sets the cap)
 * ---
 * # The claim, as a sentence.
 * <div class="body"> … components; data-s="1", "2" … on elements makes them steps … </div>
 * ::foot::
 * Source line (bottom left).
 * ::right::
 * Replaces the page stepper (bottom right), if needed.
 */
export interface DefaultLayoutProps {
  kicker?: ReactNode
  meta?: ReactNode
  number?: boolean
  stepper?: boolean
  fit?: boolean | number
  class?: string
  layoutClass?: string
  children?: ReactNode
  slots?: Record<string, ReactNode>
}

export default function DefaultLayout({ kicker, meta, number = true, stepper = true, fit = true, class: className, layoutClass, children, slots }: DefaultLayoutProps) {
  const { no } = usePageNo()
  const ref = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const steps = useSteps(ref)
  useFit(mainRef, fit)
  return (
    <StepsProvider value={steps}>
    <div ref={ref} className={`dh ${layoutClass || ''} ${className || ''}`} data-numbered={number ? '' : undefined} style={number ? numberStyle(no) : undefined}>
      <Rail kicker={kicker} meta={meta} />
      <div ref={mainRef} className="main">{slots?.default ?? children}</div>
      <Bottom foot={slots?.foot} right={slots?.right} stepper={stepper} />
    </div>
    </StepsProvider>
  )
}
