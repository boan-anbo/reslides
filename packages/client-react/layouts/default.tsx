import type { LayoutProps } from '../layoutHelper'

/**
 * Default layout - basic slide with content
 */
export function DefaultLayout({ children, class: className, layoutClass }: LayoutProps) {
  return (
    <div className={`slidev-layout default ${layoutClass || ''} ${className || ''}`}>
      {children}
    </div>
  )
}

export default DefaultLayout
