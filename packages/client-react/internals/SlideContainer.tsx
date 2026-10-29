/**
 * SlideContainer - handles viewport scaling for slides
 * Ported from apps/slidev-source/packages/client/internals/SlideContainer.vue
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { SlideScaleContext } from '../context'
import { slideAspect, slideHeight, slideWidth } from '../env'
import { useDarkMode } from '../hooks/useDarkMode'
import { useNav } from '../hooks/useNav'
import { snapshotManager } from '../logic/snapshot'
import { slideScale, subscribeStorage, viewerCssFilter } from '../state/storage'

interface SlideContainerProps {
  width?: number
  isMain?: boolean
  /** Slide number; required for snapshot lookup. */
  no?: number
  /** Render a cached image snapshot instead of live content if available. */
  useSnapshot?: boolean
  contentStyle?: CSSProperties
  style?: CSSProperties
  children?: ReactNode
  controls?: ReactNode
  onClick?: (e: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export default function SlideContainer({
  width: propWidth,
  isMain = false,
  no,
  useSnapshot = false,
  contentStyle: extraContentStyle = {},
  style,
  children,
  controls,
  onClick,
  onContextMenu,
}: SlideContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const { isPrintMode, isPlaying } = useNav()
  const slideScaleOverride = useSyncExternalStore(subscribeStorage, () => slideScale.value)
  const filters = useSyncExternalStore(subscribeStorage, () => viewerCssFilter.value)
  const { isDark } = useDarkMode()

  // Measure container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  // Calculate dimensions
  const width = propWidth ?? containerSize.width
  const height = propWidth ? propWidth / slideAspect : containerSize.height

  // Calculate scale - with localStorage override support (matches Vue):
  // the override applies outside print mode; otherwise (including print)
  // fit the slide into the container.
  const scale = Number.isFinite(slideScaleOverride) && slideScaleOverride > 0 && isMain && isPlaying && !isPrintMode
    ? slideScaleOverride
    : Math.min(width / slideWidth, height / slideHeight)

  // Content style with scale
  // --slidev-slide-scale: the computed scale value
  // --slidev-slide-container-scale: alias for child components (matches Vue SlideContainer.vue)
  const contentStyleComputed: CSSProperties = {
    ...extraContentStyle,
    filter: isPrintMode ? undefined : `invert(${filters.invert ? 1 : 0}) brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturate}) sepia(${filters.sepia}) hue-rotate(${filters.hueRotate}deg)`,
    height: `${slideHeight}px`,
    width: `${slideWidth}px`,
    '--slidev-slide-scale': scale,
    '--slidev-slide-container-scale': scale,
  } as CSSProperties

  // Container style
  const containerStyle: CSSProperties = propWidth
    ? {
        width: `${propWidth}px`,
        height: `${propWidth / slideAspect}px`,
        ...style,
      }
    : { ...style }

  // Set document scale for main container
  useEffect(() => {
    if (!isMain) return

    const rootStyle = document.documentElement.style
    rootStyle.setProperty('--slidev-slide-scale', scale.toString())

    return () => {
      rootStyle.removeProperty('--slidev-slide-scale')
    }
  }, [isMain, scale])

  // Image snapshot fallback (mirrors SlideContainer.vue's `snapshot` branch)
  const snapshot = useSnapshot && no != null
    ? snapshotManager.getSnapshot(no, isDark)
    : undefined

  if (snapshot) {
    return (
      <div className="slidev-slide-container w-full h-full relative">
        <img
          src={snapshot}
          className="w-full h-full object-cover"
          style={containerStyle}
        />
        <div className="absolute bottom-1 right-1 p0.5 text-cyan:75 bg-cyan:10 rounded" title="Snapshot">
          <div className="i-carbon-camera" />
        </div>
      </div>
    )
  }

  return (
    <div
      id={isMain ? 'slide-container' : undefined}
      ref={containerRef}
      className="slidev-slide-container relative w-full h-full overflow-hidden"
      style={containerStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div
        id={isMain ? 'slide-content' : undefined}
        className="slidev-slide-content absolute left-1/2 top-1/2 overflow-hidden bg-main"
        style={{
          ...contentStyleComputed,
          transform: 'translate(-50%, -50%) scale(var(--slidev-slide-scale))',
        }}
      >
        <SlideScaleContext.Provider value={scale}>
          {children}
        </SlideScaleContext.Provider>
      </div>
      {controls}
    </div>
  )
}
