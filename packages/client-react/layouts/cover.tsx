import type { LayoutProps } from '../layoutHelper'

/**
 * Cover layout - title slide
 */
export function CoverLayout({ children, class: className, layoutClass }: LayoutProps) {
  return (
    <div className={`slidev-layout cover ${layoutClass || ''} ${className || ''}`}>
      {children}
    </div>
  )
}

export default CoverLayout
