/**
 * NoteDisplay component for React
 * Port of Vue client internals/NoteDisplay.vue
 */

import type { ClicksContext } from '@slidev/types'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { CLICKS_MAX } from '../constants'
import './NoteDisplay.css'

const CLASS_FADE = 'slidev-note-fade'
const CLASS_MARKER = 'slidev-note-click-mark'

export interface NoteDisplayProps {
  className?: string
  noteHtml?: string
  note?: string
  highlight?: boolean
  placeholder?: string
  clicksContext?: ClicksContext
  autoScroll?: boolean
  onMarkerDblclick?: (e: MouseEvent, clicks: number) => void
  onMarkerClick?: (e: MouseEvent, clicks: number) => void
}

export function NoteDisplay({
  className = '',
  noteHtml,
  note,
  highlight = true,
  placeholder = 'No notes.',
  clicksContext,
  autoScroll = false,
  onMarkerDblclick,
  onMarkerClick,
}: NoteDisplayProps) {
  const noteDisplayRef = useRef<HTMLDivElement>(null)
  const withClicks = !!clicksContext && !!noteHtml?.includes(CLASS_MARKER)

  const processNote = useCallback(() => {
    if (!noteDisplayRef.current || !clicksContext || !noteHtml?.includes(CLASS_MARKER)) {
      return undefined
    }

    const markers = Array.from(noteDisplayRef.current.querySelectorAll(`.${CLASS_MARKER}`)) as HTMLElement[]

    const markersMap = new Map<HTMLElement, number>()
    const parentsMap = new Map<HTMLElement, [divider: HTMLElement | null, dividerClicks: number][]>()
    let lastClicks = 0

    for (const marker of markers) {
      const clicks = Number(marker.dataset.clicks)
      markersMap.set(marker, clicks)

      // Set parent clicks map
      let n: HTMLElement = marker
      let p = marker.parentElement
      while (p && n !== noteDisplayRef.current) {
        if (!parentsMap.has(p)) {
          parentsMap.set(p, [[null, lastClicks]])
        }
        parentsMap.get(p)!.push([n, clicks])
        n = p
        p = p.parentElement
      }

      lastClicks = clicks
    }

    const siblingsMap = new Map<HTMLElement, number>()
    for (const [parent, dividers] of parentsMap) {
      let hasPrefix = false
      let dividerIdx = 0
      for (const sibling of Array.from(parent.childNodes)) {
        let skip = false
        while (sibling === dividers[dividerIdx + 1]?.[0]) {
          skip = true
          dividerIdx++
        }
        if (skip) continue

        // Convert sibling text nodes to spans
        let siblingEl = sibling as HTMLElement
        if (sibling.nodeType === 3 /* text node */) {
          if (!sibling.textContent?.trim()) continue
          siblingEl = document.createElement('span')
          siblingEl.textContent = sibling.textContent
          parent.insertBefore(siblingEl, sibling)
          sibling.remove()
        }

        hasPrefix ||= dividerIdx === 0
        siblingsMap.set(siblingEl, dividers[dividerIdx][1])
      }
      if (!hasPrefix) {
        dividers[0][1] = -1
      }
    }

    // Apply
    return (current: number) => {
      const enabled = highlight
      for (const [parent, clicks] of parentsMap) {
        parent.classList.toggle(CLASS_FADE, enabled && !clicks.some(([_, c]) => c === current))
      }
      for (const [parent, clicks] of siblingsMap) {
        parent.classList.toggle(CLASS_FADE, enabled && clicks !== current)
      }
      for (const [marker, clicks] of markersMap) {
        marker.classList.remove(CLASS_FADE)
        marker.classList.toggle(`${CLASS_MARKER}-past`, enabled && clicks < current)
        marker.classList.toggle(`${CLASS_MARKER}-active`, enabled && clicks === current)
        marker.classList.toggle(`${CLASS_MARKER}-next`, enabled && clicks === current + 1)
        marker.classList.toggle(`${CLASS_MARKER}-future`, enabled && clicks > current + 1)

        marker.ondblclick = (e) => {
          if (!enabled) return
          onMarkerDblclick?.(e, clicks)
          if (e.defaultPrevented) return
          clicksContext.current = clicks
          e.stopPropagation()
          e.stopImmediatePropagation()
        }

        marker.onclick = (e) => {
          if (enabled) {
            onMarkerClick?.(e, clicks)
          }
        }

        if (enabled && autoScroll && clicks === current) {
          marker.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }
    }
  }, [noteHtml, highlight, clicksContext, autoScroll, onMarkerDblclick, onMarkerClick])

  // React can replace innerHTML during a commit. Decorate the current DOM
  // after each commit, without triggering a render that erases the markers.
  useLayoutEffect(() => {
    processNote()?.(clicksContext?.current ?? CLICKS_MAX)
  })

  if (noteHtml) {
    return (
      <div
        ref={noteDisplayRef}
        className={`prose dark:prose-invert overflow-auto outline-none slidev-note ${withClicks ? 'slidev-note-with-clicks' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: noteHtml }}
      />
    )
  }

  if (note) {
    return (
      <div className={`prose dark:prose-invert overflow-auto outline-none slidev-note ${className}`}>
        <p>{note}</p>
      </div>
    )
  }

  return (
    <div className={`prose dark:prose-invert overflow-auto outline-none opacity-50 italic select-none slidev-note ${className}`}>
      <p>{placeholder}</p>
    </div>
  )
}
