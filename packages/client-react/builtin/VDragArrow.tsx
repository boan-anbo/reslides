/**
 * VDragArrow component for React
 * Port of Vue client builtin/VDragArrow.vue
 *
 * Draggable arrow element
 */

import type { DragElementMarkdownSource } from '../composables/useDragElements'
import { useEffect, useMemo } from 'react'
import { useDragElement } from '../composables/useDragElements'
import { Arrow } from './Arrow'

export interface VDragArrowProps {
  pos?: string
  markdownSource?: DragElementMarkdownSource
  width?: number | string
  color?: string
  twoWay?: boolean
}

export function VDragArrow({
  pos = '100,100,300,300',
  markdownSource,
  width,
  color,
  twoWay,
}: VDragArrowProps) {
  const {
    dragId,
    mounted,
    unmounted,
    startDragging,
    stopDragging,
    x0,
    y0,
    width: dragWidth,
    height: dragHeight,
  } = useDragElement(pos, markdownSource, true)

  useEffect(() => {
    mounted()
    return unmounted
  }, [mounted, unmounted])

  const x1 = useMemo(() => x0 - dragWidth / 2, [x0, dragWidth])
  const y1 = useMemo(() => y0 - dragHeight / 2, [y0, dragHeight])
  const x2 = useMemo(() => x0 + dragWidth / 2, [x0, dragWidth])
  const y2 = useMemo(() => y0 + dragHeight / 2, [y0, dragHeight])

  return (
    <Arrow
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      data-drag-id={dragId}
      width={width}
      color={color}
      twoWay={twoWay}
      onDoubleClick={startDragging}
      onClickOutside={stopDragging}
    />
  )
}

export default VDragArrow
