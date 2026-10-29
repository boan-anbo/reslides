import type { LayoutProps } from '../layoutHelper'

/**
 * Full layout
 * Renders content without any padding or margins
 */
export function FullLayout({ children, class: className }: LayoutProps) {
  return (
    <div className={`slidev-layout full w-full h-full ${className || ''}`}>
      {children}
    </div>
  )
}

export default FullLayout
