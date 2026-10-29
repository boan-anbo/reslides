/**
 * DragControl component for React
 * Port of Vue client internals/DragControl.vue
 *
 * Provides resize/rotate controls for draggable elements.
 */

import type { DragElementState } from '../hooks/useDragElements'
import { clamp } from '@antfu/utils'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSlideBounds } from '../hooks/useSlideBounds'
import { slideHeight, slideWidth } from '../env'

export interface DragControlProps {
  data: DragElementState
  scale?: number
}

export function DragControl({ data, scale = 1 }: DragControlProps) {
  const {
    dragId,
    autoHeight,
    x0,
    y0,
    width,
    height,
    rotate,
    isArrow,
    setX0,
    setY0,
    setWidth,
    setHeight,
    setRotate,
  } = data

  const zoom = 1
  const { left: slideLeft, top: slideTop } = useSlideBounds(null)

  const ctrlSize = 10
  const minSize = isArrow ? Number.NEGATIVE_INFINITY : 40
  const minRemain = 10

  const rotateRad = rotate * Math.PI / 180
  const rotateSin = Math.sin(rotateRad)
  const rotateCos = Math.cos(rotateRad)

  const boundingWidth = Math.abs(width) * Math.abs(rotateCos) + Math.abs(height) * Math.abs(rotateSin)
  const boundingHeight = Math.abs(width) * Math.abs(rotateSin) + Math.abs(height) * Math.abs(rotateCos)

  const arrowRevX = isArrow && width < 0
  const arrowRevY = isArrow && height < 0

  const currentDragRef = useRef<{
    x0: number
    y0: number
    width: number
    height: number
    rotate: number
    dx0: number
    dy0: number
    ltx: number
    lty: number
    rtx: number
    rty: number
    lbx: number
    lby: number
    rbx: number
    rby: number
  } | null>(null)

  const handlePointerDown = useCallback((ev: React.PointerEvent) => {
    if (ev.buttons !== 1) return

    ev.preventDefault()
    ev.stopPropagation()

    const el = ev.target as HTMLElement
    const elBounds = el.getBoundingClientRect()

    const cross1x = width * rotateCos - height * rotateSin
    const cross1y = width * rotateSin + height * rotateCos
    const cross2x = width * rotateCos + height * rotateSin
    const cross2y = -width * rotateSin + height * rotateCos

    currentDragRef.current = {
      x0,
      y0,
      width,
      height,
      rotate,
      dx0: ev.clientX - (elBounds.left + elBounds.right) / 2,
      dy0: ev.clientY - (elBounds.top + elBounds.bottom) / 2,
      ltx: x0 - cross1x / 2,
      lty: y0 - cross1y / 2,
      rtx: x0 + cross2x / 2,
      rty: y0 - cross2y / 2,
      lbx: x0 - cross2x / 2,
      lby: y0 + cross2y / 2,
      rbx: x0 + cross1x / 2,
      rby: y0 + cross1y / 2,
    }

    ;(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
  }, [width, height, x0, y0, rotate, rotateCos, rotateSin])

  const handlePointerMove = useCallback((ev: React.PointerEvent) => {
    const currentDrag = currentDragRef.current
    if (!currentDrag || ev.buttons !== 1) return

    ev.preventDefault()
    ev.stopPropagation()

    const effectiveScale = scale * zoom
    const x = (ev.clientX - slideLeft - currentDrag.dx0) / effectiveScale
    const y = (ev.clientY - slideTop - currentDrag.dy0) / effectiveScale

    setX0(clamp(x, -boundingWidth / 2 + minRemain, slideWidth + boundingWidth / 2 - minRemain))
    setY0(clamp(y, -boundingHeight / 2 + minRemain, slideHeight + boundingHeight / 2 - minRemain))
  }, [scale, zoom, slideLeft, slideTop, boundingWidth, boundingHeight, setX0, setY0])

  const handlePointerUp = useCallback((ev: React.PointerEvent) => {
    if (!currentDragRef.current) return

    ev.preventDefault()
    ev.stopPropagation()

    currentDragRef.current = null
  }, [])

  const ctrlClasses = 'absolute border border-gray bg-gray dark:border-gray-500 dark:bg-gray-800 bg-opacity-30'

  if (!Number.isFinite(x0)) return null

  return (
    <div
      id="drag-control-container"
      data-drag-id={dragId}
      style={{
        position: 'absolute',
        zIndex: 100,
        left: `${zoom * (x0 - Math.abs(width) / 2)}px`,
        top: `${zoom * (y0 - Math.abs(height) / 2)}px`,
        width: `${zoom * Math.abs(width)}px`,
        height: `${zoom * Math.abs(height)}px`,
        transformOrigin: 'center center',
        transform: `rotate(${rotate}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={`absolute inset-0 z-nav dark:border-gray-400 ${isArrow ? '' : 'border border-dark'}`}>
        {!autoHeight && (
          <>
            {/* Corner controls */}
            <div
              className={ctrlClasses}
              style={{
                width: `${ctrlSize}px`,
                height: `${ctrlSize}px`,
                margin: `-${ctrlSize / 2}px`,
                left: arrowRevX ? undefined : '0',
                right: arrowRevX ? '0' : undefined,
                top: arrowRevY ? undefined : '0',
                bottom: arrowRevY ? '0' : undefined,
                cursor: isArrow ? 'move' : 'nwse-resize',
                borderRadius: isArrow ? '50%' : undefined,
              }}
            />
            <div
              className={ctrlClasses}
              style={{
                width: `${ctrlSize}px`,
                height: `${ctrlSize}px`,
                margin: `-${ctrlSize / 2}px`,
                left: arrowRevX ? '0' : undefined,
                right: arrowRevX ? undefined : '0',
                top: arrowRevY ? '0' : undefined,
                bottom: arrowRevY ? undefined : '0',
                cursor: isArrow ? 'move' : 'nwse-resize',
                borderRadius: isArrow ? '50%' : undefined,
              }}
            />
          </>
        )}
        {!isArrow && (
          <>
            {/* Border controls */}
            <div
              className={ctrlClasses}
              style={{
                width: `${ctrlSize}px`,
                height: `${ctrlSize}px`,
                margin: `-${ctrlSize / 2}px`,
                left: '0',
                top: '50%',
                cursor: 'ew-resize',
                borderRadius: '50%',
              }}
            />
            <div
              className={ctrlClasses}
              style={{
                width: `${ctrlSize}px`,
                height: `${ctrlSize}px`,
                margin: `-${ctrlSize / 2}px`,
                left: '100%',
                top: '50%',
                cursor: 'ew-resize',
                borderRadius: '50%',
              }}
            />
            {/* Rotate control */}
            <div
              className={ctrlClasses}
              style={{
                width: `${ctrlSize}px`,
                height: `${ctrlSize}px`,
                margin: `-${ctrlSize / 2}px`,
                left: '50%',
                top: '-20px',
                cursor: 'grab',
                borderRadius: '50%',
              }}
            />
            <div
              className="absolute -top-15px w-0 border border-dashed border-dark dark:border-gray-400"
              style={{
                left: 'calc(50% - 1px)',
                height: autoHeight ? '14px' : '10px',
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
