/**
 * PrintSlideClick component for React
 * Port of Vue client internals/PrintSlideClick.vue
 *
 * Single click state rendering for print mode.
 */

import type { SlideRoute } from '../hooks/useSlides'
import type { ClicksContext } from '@slidev/types'

export interface PrintSlideClickProps {
  route: SlideRoute
  clicksContext: ClicksContext
  scale?: number
}

export function PrintSlideClick({ route, clicksContext, scale = 1 }: PrintSlideClickProps) {
  return (
    <div
      className="print-slide-click page-break-after"
      data-slide-no={route.no}
      data-clicks={clicksContext.current}
    >
      <div
        className="slide-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Slide content at specific click state would be rendered here */}
        <div className="slide-content">
          Slide {route.no} - Click {clicksContext.current}
        </div>
      </div>
    </div>
  )
}
