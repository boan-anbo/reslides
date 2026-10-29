/**
 * useDragElements composable for React
 * Port of Vue client composables/useDragElements.ts
 *
 * Draggable elements management
 */

import type { SlidePatch } from '@slidev/types'
import type { CSSProperties } from 'react'
import { debounce, ensureSuffix } from '@antfu/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeId } from '../logic/utils'
import { activeDragElement } from '../state'
import { useNav } from './useNav'
import { useDynamicSlideInfo } from './useSlideInfo'
import { useSlideBounds } from './useSlideBounds'
import { useSlideContext } from '../context'

export type DragElementDataSource = 'frontmatter' | 'prop' | 'directive'
/**
 * Markdown source position, injected by markdown-it plugin
 */
export type DragElementMarkdownSource = [startLine: number, endLine: number, index: number]

export type DragElementsUpdater = (id: string, posStr: string, type: DragElementDataSource, markdownSource?: DragElementMarkdownSource) => void

const map: Record<number, DragElementsUpdater> = {}

export function useDragElementsUpdater(no: number): DragElementsUpdater {
  if (!(__DEV__ && __SLIDEV_FEATURE_EDITOR__))
    return () => {}

  if (map[no])
    return map[no]

  const { info, update } = useDynamicSlideInfo(no)

  let newPatch: SlidePatch | null = null
  async function save() {
    if (newPatch) {
      await update({
        ...newPatch,
        skipHmr: true,
      })
      newPatch = null
    }
  }
  const debouncedSave = debounce(500, save)

  return map[no] = (id, posStr, type, markdownSource) => {
    if (!info.value)
      return

    if (type === 'frontmatter') {
      const frontmatter = info.value.frontmatter
      frontmatter.dragPos ||= {}
      if (frontmatter.dragPos[id] === posStr)
        return
      frontmatter.dragPos[id] = posStr
      newPatch = {
        frontmatter: {
          dragPos: frontmatter.dragPos,
        },
      }
    }
    else {
      if (!markdownSource)
        throw new Error(`[Slidev] VDrag Element ${id} is missing markdown source`)

      const [startLine, endLine, idx] = markdownSource
      const lines = info.value.content.split(/\r?\n/g)

      let section = lines.slice(startLine, endLine).join('\n')
      let replaced = false

      section = type === 'prop'
        // eslint-disable-next-line regexp/no-super-linear-backtracking
        ? section.replace(/<(v-?drag-?\w*)(.*?)(\/)?>/gi, (full, tag, attrs, selfClose = '', index) => {
            if (index === idx) {
              replaced = true
              const posMatch = attrs.match(/pos=".*?"/)
              if (!posMatch)
                return `<${tag}${ensureSuffix(' ', attrs)}pos="${posStr}"${selfClose}>`
              const start = posMatch.index
              const end = start + posMatch[0].length
              return `<${tag}${attrs.slice(0, start)}pos="${posStr}"${attrs.slice(end)}${selfClose}>`
            }
            return full
          })
        : section.replace(/(?<![</\w])v-drag(?:=".*?")?/gi, (full, index) => {
            if (index === idx) {
              replaced = true
              return `v-drag="${posStr}"`
            }
            return full
          })

      if (!replaced)
        throw new Error(`[Slidev] VDrag Element ${id} is not found in the markdown source`)

      lines.splice(
        startLine,
        endLine - startLine,
        section,
      )

      const newContent = lines.join('\n')
      if (info.value.content === newContent)
        return
      newPatch = {
        content: newContent,
      }
      info.value = {
        ...info.value,
        content: newContent,
      }
    }
    debouncedSave()
  }
}

export interface DragElementState {
  dragId: string
  dataSource: DragElementDataSource
  markdownSource?: DragElementMarkdownSource
  isArrow: boolean
  zoom: number
  autoHeight: boolean
  x0: number
  y0: number
  width: number
  height: number
  rotate: number
  container: React.RefObject<HTMLElement | null>
  containerStyle: CSSProperties
  dragging: boolean
  mounted: () => void
  unmounted: () => void
  startDragging: () => void
  stopDragging: () => void
  setX0: (v: number) => void
  setY0: (v: number) => void
  setWidth: (v: number) => void
  setHeight: (v: number) => void
  setRotate: (v: number) => void
}

export function useDragElement(
  posRaw?: string | number | number[],
  markdownSource?: DragElementMarkdownSource,
  isArrow = false,
): DragElementState {
  const { $slidev, $renderContext, $scale, $zoom } = useSlideContext()
  const frontmatter = $slidev?.nav.currentSlideRoute.meta?.slide?.frontmatter ?? {}
  const page = $slidev?.nav.currentSlideNo ?? 1
  const scale = $scale ?? 1
  const zoom = $zoom ?? 1
  const { isPrintMode } = useNav()
  const enabled = ['slide', 'presenter'].includes($renderContext) && !isPrintMode.value

  // Get slide bounds for initial position calculation
  const slideElementRef = useRef<HTMLElement | null>(null)
  const { left: slideLeft, top: slideTop } = useSlideBounds(slideElementRef)

  // Parse position
  let dataSource: DragElementDataSource = 'prop'
  let dragId: string = makeId()
  let pos: number[] | undefined
  let rawPos = posRaw

  if (Array.isArray(rawPos)) {
    pos = rawPos
  }
  else if (typeof rawPos === 'string' && rawPos.includes(',')) {
    pos = rawPos.split(',').map(Number)
  }
  else if (rawPos != null) {
    dataSource = 'frontmatter'
    dragId = `${rawPos}`
    rawPos = frontmatter?.dragPos?.[dragId]
    pos = (rawPos as string)?.split(',').map(Number)
  }

  if (dataSource !== 'frontmatter' && !markdownSource) {
    throw new Error('[Slidev] Can not identify the source position of the v-drag element, please provide an explicit `id` prop.')
  }

  const autoHeight = !isArrow && posRaw != null && !Number.isFinite(pos?.[3])
  pos ??= [Number.NaN, Number.NaN, 0]

  const [width, setWidth] = useState(pos[2])
  const [x0, setX0] = useState(pos[0] + pos[2] / 2)
  const [rotate, setRotate] = useState(isArrow ? 0 : (pos[4] ?? 0))

  const rotateRad = useMemo(() => rotate * Math.PI / 180, [rotate])
  const rotateSin = useMemo(() => Math.sin(rotateRad), [rotateRad])
  const rotateCos = useMemo(() => Math.cos(rotateRad), [rotateRad])

  const container = useRef<HTMLElement>(null)
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [actualHeight, setActualHeight] = useState(0)

  const updateBounds = useCallback(() => {
    if (!container.current)
      return
    const rect = container.current.getBoundingClientRect()
    const newBounds = {
      left: rect.left / zoom,
      top: rect.top / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    }
    setBounds(newBounds)
    setActualHeight(((newBounds.width + newBounds.height) / scale / (Math.abs(rotateSin) + Math.abs(rotateCos)) - width))
  }, [zoom, scale, rotateSin, rotateCos, width])

  // Watch width changes and update bounds
  useEffect(() => {
    updateBounds()
  }, [width, updateBounds])

  const [configuredHeight, setConfiguredHeight] = useState(pos[3] ?? 0)
  const height = autoHeight ? actualHeight || 0 : configuredHeight
  const setHeight = autoHeight ? () => {} : setConfiguredHeight

  const [configuredY0, setConfiguredY0] = useState(autoHeight ? pos[1] : pos[1] + (pos[3] ?? 0) / 2)
  const y0 = autoHeight ? configuredY0 + height / 2 : configuredY0
  const setY0 = autoHeight
    ? (v: number) => setConfiguredY0(v - height / 2)
    : setConfiguredY0

  const containerStyle: CSSProperties = useMemo(() => {
    return Number.isFinite(x0)
      ? {
          position: 'absolute',
          zIndex: 100,
          left: `${x0 - width / 2}px`,
          top: `${y0 - height / 2}px`,
          width: `${width}px`,
          height: autoHeight ? undefined : `${height}px`,
          transformOrigin: 'center center',
          transform: `rotate(${rotate}deg)`,
        }
      : {
          position: 'absolute',
          zIndex: 100,
        }
  }, [x0, y0, width, height, rotate, autoHeight])

  const [dragging, setDragging] = useState(false)

  const startDragging = useCallback(() => {
    if (!enabled)
      return
    updateBounds()
    activeDragElement.value = { dragId, isArrow }
    setDragging(true)
  }, [enabled, updateBounds, dragId, isArrow])

  const stopDragging = useCallback(() => {
    if (!enabled)
      return
    if (activeDragElement.value?.dragId === dragId) {
      activeDragElement.value = null
      setDragging(false)
    }
  }, [enabled, dragId])

  const mounted = useCallback(() => {
    if (!enabled)
      return
    updateBounds()
    // Handle initial position calculation when no position is provided
    if (!posRaw) {
      setTimeout(() => {
        updateBounds()
        // Calculate initial position based on element's current position relative to slide
        if (bounds.left && bounds.top && bounds.width && bounds.height) {
          setX0((bounds.left + bounds.width / 2 - slideLeft) / scale)
          setY0((bounds.top - slideTop) / scale)
          setWidth(bounds.width / scale)
          if (!autoHeight) {
            setConfiguredHeight(bounds.height / scale)
          }
        }
      }, 100)
    }
  }, [enabled, updateBounds, posRaw, bounds, slideLeft, slideTop, scale, autoHeight])

  const unmounted = useCallback(() => {
    if (!enabled)
      return
    stopDragging()
  }, [enabled, stopDragging])

  // Watch for position updates and sync to source
  useEffect(() => {
    if (!enabled)
      return

    const updater = useDragElementsUpdater(page)
    let posStr = [x0 - width / 2, y0 - height / 2, width].map(Math.round).join()
    if (autoHeight)
      posStr += dataSource === 'directive' ? ',NaN' : ',_'
    else
      posStr += `,${Math.round(height)}`
    if (Math.round(rotate) !== 0)
      posStr += `,${Math.round(rotate)}`

    if (dataSource === 'directive')
      posStr = `[${posStr}]`

    updater(dragId, posStr, dataSource, markdownSource)
  }, [x0, y0, width, height, rotate, enabled, page, dragId, dataSource, markdownSource, autoHeight])

  // Click outside handler
  useEffect(() => {
    if (!dragging)
      return

    const handleClickOutside = (ev: MouseEvent) => {
      const dragControl = document.querySelector('#drag-control-container')
      if (dragControl && ev.target && dragControl.contains(ev.target as HTMLElement))
        return
      if (container.current && !container.current.contains(ev.target as HTMLElement))
        stopDragging()
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [dragging, stopDragging])

  // Window focus handler - stop dragging when window loses focus
  useEffect(() => {
    if (!dragging)
      return

    const handleBlur = () => {
      stopDragging()
    }

    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [dragging, stopDragging])

  return {
    dragId,
    dataSource,
    markdownSource,
    isArrow,
    zoom,
    autoHeight,
    x0,
    y0,
    width,
    height,
    rotate,
    container,
    containerStyle,
    dragging,
    mounted,
    unmounted,
    startDragging,
    stopDragging,
    setX0,
    setY0,
    setWidth,
    setHeight,
    setRotate,
  }
}

export type { DragElementState as DragElementStateType }

export default useDragElement
