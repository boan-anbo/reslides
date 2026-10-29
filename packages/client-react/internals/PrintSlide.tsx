/**
 * PrintSlide component for React
 * Port of Vue client internals/PrintSlide.vue
 *
 * Single slide rendering for print mode.
 */

import type { SlideRoute } from '../hooks/useSlides'

export interface PrintSlideProps {
  route: SlideRoute
  scale?: number
}

export function PrintSlide({ route, scale = 1 }: PrintSlideProps) {
  // In the actual implementation, this would render the slide content
  // For now, we provide a placeholder that matches the structure
  return (
    <div
      className="print-slide page-break-after"
      data-slide-no={route.no}
    >
      <div
        className="slide-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Slide content would be rendered here */}
        <div className="slide-content">
          Slide {route.no}
        </div>
      </div>
    </div>
  )
}
