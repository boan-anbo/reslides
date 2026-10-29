/**
 * Drag Elements hook for React
 * Port of Vue client composables/useDragElements.ts
 *
 * Handles draggable elements with position tracking and markdown source patching.
 */

import type { SlidePatch } from '@slidev/types'
import { debounce, ensureSuffix } from '@antfu/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeId } from '../logic/utils'
import { useNav } from './useNav'
import { useSlideBounds } from './useSlideBounds'
import { useDynamicSlideInfo } from './useSlideInfo'

export type DragElementDataSource = 'frontmatter' | 'prop' | 'directive'
/**
 * Markdown source position, injected by markdown-it plugin
 */
export type DragElementMarkdownSource = [startLine: number, endLine: number, index: number]

export type DragElementsUpdater = (id: string, posStr: string, type: DragElementDataSource, markdownSource?: DragElementMarkdownSource) => void

const updaterMap: Record<number, DragElementsUpdater> = {}

// Global active drag element state
let activeDragElement: DragElementState | null = null
const activeDragListeners = new Set<() => void>()

function setActiveDragElement(state: DragElementState | null) {
  activeDragElement = state
  activeDragListeners.forEach(fn => fn())
}

export function useDragElementsUpdater(no: number): DragElementsUpdater {
  // @ts-expect-error - __DEV__ and __SLIDEV_FEATURE_EDITOR__ are global
  if (!(__DEV__ && __SLIDEV_FEATURE_EDITOR__)) {
    return () => {}
  }

  if (updaterMap[no]) {
    return updaterMap[no]
  }

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

  const updater: DragElementsUpdater = (id, posStr, type, markdownSource) => {
    if (!info) return

    if (type === 'frontmatter') {
      const frontmatter = info.frontmatter
      frontmatter.dragPos ||= {}
      if (frontmatter.dragPos[id] === posStr) return
      frontmatter.dragPos[id] = posStr
      newPatch = {
        frontmatter: {
          dragPos: frontmatter.dragPos,
        },
      }
    }
    else {
      if (!markdownSource) {
        throw new Error(`[Slidev] VDrag Element ${id} is missing markdown source`)
      }

      const [startLine, endLine, idx] = markdownSource
      const lines = info.content.split(/\r?\n/g)

      let section = lines.slice(startLine, endLine).join('\n')
      let replaced = false

      section = type === 'prop'
        // eslint-disable-next-line regexp/no-super-linear-backtracking
        ? section.replace(/<(v-?drag-?\w*)(.*?)(\/)?>/gi, (full, tag, attrs, selfClose = '', index) => {
            if (index === idx) {
              replaced = true
              const posMatch = attrs.match(/pos=".*?"/)
              if (!posMatch) {
                return `<${tag}${ensureSuffix(' ', attrs)}pos="${posStr}"${selfClose}>`
              }
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

      if (!replaced) {
        throw new Error(`[Slidev] VDrag Element ${id} is not found in the markdown source`)
      }

      lines.splice(startLine, endLine - startLine, section)

      const newContent = lines.join('\n')
      if (info.content === newContent) return
      newPatch = {
        content: newContent,
      }
    }
    debouncedSave()
  }

  updaterMap[no] = updater
  return updater
}

export interface UseDragElementOptions {
  /** Initial position as string "x,y,w,h,r" or number (frontmatter key) or array */
  posRaw?: string | number | number[]
  /** Markdown source position */
  markdownSource?: DragElementMarkdownSource
  /** Whether this is an arrow element */
  isArrow?: boolean
  /** Frontmatter data */
  frontmatter?: Record<string, any>
  /** Render context */
  renderContext?: string
  /** Current page number */
  page?: number
  /** Scale factor */
  scale?: number
  /** Zoom level */
  zoom?: number
  /** Slide element ref for bounds calculation */
  slideElement?: HTMLElement | null
}

export interface DragElementState {
  dragId: string
  dataSource: DragElementDataSource
  markdownSource?: DragElementMarkdownSource
  isArrow: boolean
  autoHeight: boolean
  x0: number
  y0: number
  width: number
  height: number
  rotate: number
  containerRef: React.RefCallback<HTMLElement>
  containerStyle: React.CSSProperties
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

export function useDragElement(options: UseDragElementOptions = {}): DragElementState {
  const {
    posRaw: initialPosRaw,
    markdownSource,
    isArrow = false,
    frontmatter = {},
    renderContext = 'slide',
    page: initialPage,
    scale: initialScale = 1,
    zoom: initialZoom = 1,
    slideElement,
  } = options

  const { currentPage, isPrintMode } = useNav()
  const page = initialPage ?? currentPage
  const scale = initialScale
  const zoom = initialZoom

  const { left: slideLeft, top: slideTop } = useSlideBounds(slideElement ?? null)

  const enabled = ['slide', 'presenter'].includes(renderContext) && !isPrintMode

  const containerRef = useRef<HTMLElement | null>(null)
  const stateRef = useRef<DragElementState | null>(null)

  // Parse initial position
  const parsed = useMemo(() => {
    let dataSource: DragElementDataSource = 'prop'
    let dragId = makeId()
    let pos: number[] | undefined
    let posRaw = initialPosRaw

    if (Array.isArray(posRaw)) {
      pos = posRaw
    }
    else if (typeof posRaw === 'string' && posRaw.includes(',')) {
      pos = posRaw.split(',').map(Number)
    }
    else if (posRaw != null) {
      dataSource = 'frontmatter'
      dragId = `${posRaw}`
      posRaw = frontmatter?.dragPos?.[dragId]
      pos = (posRaw as string)?.split(',').map(Number)
    }

    if (dataSource !== 'frontmatter' && !markdownSource) {
      throw new Error('[Slidev] Can not identify the source position of the v-drag element, please provide an explicit `id` prop.')
    }

    const autoHeight = !isArrow && initialPosRaw != null && !Number.isFinite(pos?.[3])
    pos ??= [Number.NaN, Number.NaN, 0]

    return { dataSource, dragId, pos, autoHeight }
  }, [initialPosRaw, frontmatter, markdownSource, isArrow])

  const [x0, setX0] = useState(parsed.pos[0] + parsed.pos[2] / 2)
  const [y0, setY0] = useState(parsed.autoHeight ? parsed.pos[1] : parsed.pos[1] + (parsed.pos[3] ?? 0) / 2)
  const [width, setWidth] = useState(parsed.pos[2])
  const [height, setHeight] = useState(parsed.pos[3] ?? 0)
  const [rotate, setRotate] = useState(isArrow ? 0 : (parsed.pos[4] ?? 0))
  const [dragging, setDragging] = useState(false)
  const [actualHeight, setActualHeight] = useState(0)

  const rotateRad = rotate * Math.PI / 180
  const rotateSin = Math.sin(rotateRad)
  const rotateCos = Math.cos(rotateRad)

  const effectiveHeight = parsed.autoHeight ? actualHeight : height

  // Update bounds
  const updateBounds = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const bounds = {
      left: rect.left / zoom,
      top: rect.top / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    }
    const newActualHeight = ((bounds.width + bounds.height) / scale / (Math.abs(rotateSin) + Math.abs(rotateCos)) - width)
    setActualHeight(newActualHeight)
    return bounds
  }, [zoom, scale, rotateSin, rotateCos, width])

  // Container style
  const containerStyle = useMemo((): React.CSSProperties => {
    if (Number.isFinite(x0)) {
      return {
        position: 'absolute',
        zIndex: 100,
        left: `${x0 - width / 2}px`,
        top: `${y0 - effectiveHeight / 2}px`,
        width: `${width}px`,
        height: parsed.autoHeight ? undefined : `${effectiveHeight}px`,
        transformOrigin: 'center center',
        transform: `rotate(${rotate}deg)`,
      }
    }
    return {
      position: 'absolute',
      zIndex: 100,
    }
  }, [x0, y0, width, effectiveHeight, rotate, parsed.autoHeight])

  // Get updater
  const updater = useDragElementsUpdater(page)

  // Sync position changes to markdown
  useEffect(() => {
    if (!enabled) return

    let posStr = [x0 - width / 2, y0 - effectiveHeight / 2, width].map(Math.round).join()
    if (parsed.autoHeight) {
      posStr += parsed.dataSource === 'directive' ? ',NaN' : ',_'
    }
    else {
      posStr += `,${Math.round(effectiveHeight)}`
    }
    if (Math.round(rotate) !== 0) {
      posStr += `,${Math.round(rotate)}`
    }

    if (parsed.dataSource === 'directive') {
      posStr = `[${posStr}]`
    }

    updater(parsed.dragId, posStr, parsed.dataSource, markdownSource)
  }, [x0, y0, width, effectiveHeight, rotate, enabled, parsed, updater, markdownSource])

  // Subscribe to active drag element changes
  useEffect(() => {
    const listener = () => {
      setDragging(activeDragElement === stateRef.current)
    }
    activeDragListeners.add(listener)
    return () => {
      activeDragListeners.delete(listener)
    }
  }, [])

  // Click outside handler
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (ev: MouseEvent) => {
      const container = document.querySelector('#drag-control-container')
      if (container && ev.target && container.contains(ev.target as HTMLElement)) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(ev.target as HTMLElement)) {
        if (activeDragElement === stateRef.current) {
          setActiveDragElement(null)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [enabled])

  // Window focus handler
  useEffect(() => {
    if (!enabled) return

    const handleBlur = () => {
      if (activeDragElement === stateRef.current) {
        setActiveDragElement(null)
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [enabled])

  const state: DragElementState = {
    dragId: parsed.dragId,
    dataSource: parsed.dataSource,
    markdownSource,
    isArrow,
    autoHeight: parsed.autoHeight,
    x0,
    y0,
    width,
    height: effectiveHeight,
    rotate,
    containerRef: useCallback((el: HTMLElement | null) => {
      containerRef.current = el
    }, []),
    containerStyle,
    dragging,
    setX0,
    setY0,
    setWidth,
    setHeight,
    setRotate,
    mounted() {
      if (!enabled) return
      updateBounds()
      if (initialPosRaw == null) {
        setTimeout(() => {
          const bounds = updateBounds()
          if (bounds) {
            setX0((bounds.left + bounds.width / 2 - slideLeft) / scale)
            setY0((bounds.top - slideTop) / scale)
            setWidth(bounds.width / scale)
            setHeight(bounds.height / scale)
          }
        }, 100)
      }
    },
    unmounted() {
      if (!enabled) return
      if (activeDragElement === stateRef.current) {
        setActiveDragElement(null)
      }
    },
    startDragging() {
      if (!enabled) return
      updateBounds()
      setActiveDragElement(stateRef.current)
    },
    stopDragging() {
      if (!enabled) return
      if (activeDragElement === stateRef.current) {
        setActiveDragElement(null)
      }
    },
  }

  stateRef.current = state

  return state
}
