import type { LayoutProps } from '../layoutHelper'

/**
 * Center layout - content centered
 * Port of Vue client layouts/center.vue:
 *   <div class="slidev-layout center h-full grid place-content-center">
 *     <div class="my-auto"><slot /></div>
 *   </div>
 * (A previous flex-col reinvention let content exceed the slide height.)
 */
export function CenterLayout({ children, class: className, layoutClass }: LayoutProps) {
  return (
    <div className={`slidev-layout center h-full grid place-content-center ${layoutClass || ''} ${className || ''}`}>
      <div className="my-auto">
        {children}
      </div>
    </div>
  )
}

export default CenterLayout
