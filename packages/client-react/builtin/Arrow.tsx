/**
 * Arrow component for React
 * Port of Vue client builtin/Arrow.vue
 *
 * Simple Arrow
 *
 * <Arrow x1={10} y1={20} x2={100} y2={200} color="green" width={3} />
 */

import { useEffect, useRef } from 'react'
import { makeId } from '../logic/utils'

export interface ArrowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'color'> {
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  width?: number | string
  color?: string
  twoWay?: boolean
  /** Mirrors Vue's @dblclick emit (e.g. VDragArrow's startDragging). */
  onDoubleClick?: React.MouseEventHandler<SVGElement>
  onClickOutside?: () => void
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  width,
  color,
  twoWay,
  onDoubleClick,
  onClickOutside,
  ...rest
}: ArrowProps) {
  const id = useRef(makeId()).current
  const clickAreaRef = useRef<SVGLineElement>(null)

  const markerAttrs = {
    markerUnits: 'strokeWidth' as const,
    markerHeight: 7,
    refY: 3.5,
    orient: 'auto' as const,
  }

  // Click outside handler - pointerdown to match @vueuse/core's
  // onClickOutside (covers touch as well as mouse).
  useEffect(() => {
    if (!onClickOutside)
      return

    function handleClickOutside(event: PointerEvent) {
      if (clickAreaRef.current && !clickAreaRef.current.contains(event.target as Node)) {
        onClickOutside?.()
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [onClickOutside])

  return (
    <svg
      className="absolute left-0 top-0"
      width={Math.max(+x1, +x2) + 50}
      height={Math.max(+y1, +y2) + 50}
      {...rest}
    >
      <defs>
        <marker id={id} markerWidth={10} refX={9} {...markerAttrs}>
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={color || 'currentColor'}
            onDoubleClick={onDoubleClick}
          />
        </marker>
        {twoWay && (
          <marker id={`${id}-rev`} markerWidth={20} refX={11} {...markerAttrs}>
            <polygon
              points="20 0, 10 3.5, 20 7"
              fill={color || 'currentColor'}
              onDoubleClick={onDoubleClick}
            />
          </marker>
        )}
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color || 'currentColor'}
        strokeWidth={width || 2}
        markerEnd={`url(#${id})`}
        markerStart={twoWay ? `url(#${id}-rev)` : 'none'}
        onDoubleClick={onDoubleClick}
      />
      <line
        ref={clickAreaRef}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeLinecap="round"
        strokeWidth={20}
        onDoubleClick={onDoubleClick}
      />
    </svg>
  )
}

export default Arrow
