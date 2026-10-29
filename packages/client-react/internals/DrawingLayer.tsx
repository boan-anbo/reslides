/**
 * DrawingLayer component for React
 * Port of Vue client internals/DrawingLayer.vue
 *
 * SVG canvas layer for slide drawings.
 */

import { useEffect, useRef } from 'react'
import { useDrawings } from '../hooks/useDrawings'
import { useSlideContext } from '../context'

export interface DrawingLayerProps {
  page?: number
}

export function DrawingLayer({ page }: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { drauu, drawingEnabled, loadCanvas } = useDrawings()
  const { $scale: scale } = useSlideContext()

  useEffect(() => {
    if (svgRef.current && drauu) {
      drauu.mount(svgRef.current, svgRef.current.parentElement ?? undefined)
      loadCanvas(page)
    }

    return () => {
      drauu?.unmount()
    }
  }, [drauu, page, loadCanvas])

  useEffect(() => { drauu.options.coordinateScale = 1 / scale }, [drauu, scale])

  return (
    <svg
      ref={svgRef}
      className={`slidev-drawing-layer absolute inset-0 w-full h-full ${
        drawingEnabled ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ touchAction: 'none' }}
    />
  )
}
