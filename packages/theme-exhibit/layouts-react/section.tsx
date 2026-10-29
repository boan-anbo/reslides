import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Bottom, Rail, StepsProvider, useSteps } from '../utils/page'

/**
 * Section divider or single statement: one large sentence, centred vertically.
 *
 * ---
 * layout: section
 * kicker: Part two
 * ---
 * # The question was older than expert systems.
 * Optional grey line under it.
 */
export interface SectionLayoutProps {
  kicker?: ReactNode
  meta?: ReactNode
  stepper?: boolean
  class?: string
  layoutClass?: string
  children?: ReactNode
  slots?: Record<string, ReactNode>
}

export default function SectionLayout({ kicker, meta, stepper = true, class: className, layoutClass, children, slots }: SectionLayoutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const steps = useSteps(ref)
  return (
    <StepsProvider value={steps}>
    <div ref={ref} className={`dh section ${layoutClass || ''} ${className || ''}`}>
      <Rail kicker={kicker} meta={meta} />
      <div className="main">{slots?.default ?? children}</div>
      <Bottom foot={slots?.foot} right={slots?.right} stepper={stepper} />
    </div>
    </StepsProvider>
  )
}
