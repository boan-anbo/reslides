/**
 * VDrag component for React
 * Port of Vue client builtin/VDrag.vue
 *
 * Draggable element wrapper
 */

import type { DragElementMarkdownSource } from '../composables/useDragElements'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useDragElement } from '../composables/useDragElements'

export interface VDragProps {
  pos?: string
  markdownSource?: DragElementMarkdownSource
  children?: ReactNode
}

export function VDrag({ pos, markdownSource, children }: VDragProps) {
  const {
    dragId,
    container,
    containerStyle,
    mounted,
    unmounted,
    startDragging,
  } = useDragElement(pos, markdownSource)

  useEffect(() => {
    mounted()
    return unmounted
  }, [mounted, unmounted])

  return (
    <div
      ref={container as React.RefObject<HTMLDivElement>}
      data-drag-id={dragId}
      style={containerStyle}
      className="p-1"
      onDoubleClick={startDragging}
    >
      {children}
    </div>
  )
}

export default VDrag
