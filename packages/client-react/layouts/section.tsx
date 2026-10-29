import type { LayoutProps } from '../layoutHelper'

/**
 * Section layout - section divider slide
 */
export function SectionLayout({ children, class: className, layoutClass }: LayoutProps) {
  return (
    <div className={`slidev-layout section ${layoutClass || ''} ${className || ''}`}>
      {children}
    </div>
  )
}

export default SectionLayout
