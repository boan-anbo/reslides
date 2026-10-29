/**
 * DrawingPreview component for React
 * Port of Vue client internals/DrawingPreview.vue
 *
 * Shows drawing preview in overview mode.
 */

import { useDrawingState } from '../state/drawings'

export interface DrawingPreviewProps {
  page: number
}

export function DrawingPreview({ page }: DrawingPreviewProps) {
  const svgContent = useDrawingState()[page]

  if (!svgContent) return null

  return (
    <svg
      className="slidev-drawing-preview absolute inset-0 w-full h-full pointer-events-none"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
