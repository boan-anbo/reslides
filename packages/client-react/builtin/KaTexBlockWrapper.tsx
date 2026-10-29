/**
 * KaTexBlockWrapper component for React
 * Port of Vue client builtin/KaTexBlockWrapper.vue
 *
 * Line highlighting for KaTex blocks
 * (auto transformed, you don't need to use this component directly)
 *
 * Usage:
 * $$ {1|3|all}
 * \begin{array}{c}
 *
 * \nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
 * = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
 *
 * \nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
 *
 * \nabla \cdot \vec{\mathbf{B}} & = 0
 *
 * \end{array}
 * $$
 *
 * Learn more: https://sli.dev/guide/syntax.html#latex-line-highlighting
 */

import type { ReactNode } from 'react'
import { parseRangeString } from '@slidev/parser/utils'
import { useEffect, useMemo, useRef } from 'react'
import { CLASS_VCLICK_HIDDEN, CLASS_VCLICK_TARGET, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { useClicksValue } from '../hooks/useClicks'
import { makeId } from '../logic/utils'
import { decodeLzObject, parseRangesRaw } from './lzProps'

export interface KaTexBlockWrapperProps {
  ranges?: string[]
  /** pipe-joined ranges from the markdown pipeline ("1,2|3-4") */
  rangesRaw?: string
  /** lz-compressed options object from the markdown pipeline */
  optionsLz?: string
  finally?: string | number
  startLine?: number
  at?: string | number
  children?: ReactNode
}

export function KaTexBlockWrapper(rawProps: KaTexBlockWrapperProps) {
  // Merge pipeline-encoded props (see builtin/lzProps.ts)
  const blockOptions = decodeLzObject(rawProps.optionsLz)
  const {
    ranges = parseRangesRaw(rawProps.rangesRaw),
    finally: finallyProp = 'last',
    startLine = 1,
    at = '+1',
    children,
  } = { ...blockOptions, ...rawProps } as KaTexBlockWrapperProps
  const { $clicksContext: clicks } = useSlideContext()
  const clicksValue = useClicksValue()
  const el = useRef<HTMLDivElement>(null)
  const id = useRef(makeId())
  const registeredRef = useRef(false)
  const clicksInfoRef = useRef<{ start: number } | null>(null)

  // Register clicks once on mount (Vue parity: onMounted)
  useEffect(() => {
    if (!clicks || !ranges?.length || registeredRef.current)
      return

    const clicksInfo = clicks.calculateSince(at, ranges.length - 1)
    if (clicksInfo) {
      clicks.register(id.current, clicksInfo)
      clicksInfoRef.current = clicksInfo
      registeredRef.current = true
    }

    return () => {
      clicks?.unregister(id.current)
      registeredRef.current = false
      clicksInfoRef.current = null
    }
  }, [clicks, ranges, at])

  // Calculate index based on clicks (reactive via clicksValue)
  const index = useMemo(() => {
    if (!clicksInfoRef.current) return CLICKS_MAX
    return Math.max(0, clicksValue - clicksInfoRef.current.start + 1)
  }, [clicksValue])

  const finallyRange = useMemo(() => {
    return finallyProp === 'last' ? ranges.at(-1) : finallyProp.toString()
  }, [finallyProp, ranges])

  // Update highlight when clicksValue changes (reactive, no polling)
  useEffect(() => {
    if (!el.current || !ranges?.length)
      return

    let rangeStr = ranges[index] ?? finallyRange
    const hide = rangeStr === 'hide'
    el.current.classList.toggle(CLASS_VCLICK_HIDDEN, hide)
    if (hide)
      rangeStr = ranges[index + 1] ?? finallyRange

    // KaTeX equations have col-align-XXX as parent
    const equationParents = el.current.querySelectorAll('.mtable > [class*=col-align]')
    if (!equationParents)
      return

    // For each row we extract the individual equation rows
    const equationRowsOfEachParent = Array.from(equationParents)
      .map(item => Array.from(item.querySelectorAll(':scope > .vlist-t > .vlist-r > .vlist > span > .mord')))

    // This list maps rows from different parents to line them up
    const lines: Element[][] = []
    for (const equationRowParent of equationRowsOfEachParent) {
      equationRowParent.forEach((equationRow, idx) => {
        if (!equationRow)
          return
        if (Array.isArray(lines[idx]))
          lines[idx].push(equationRow)
        else
          lines[idx] = [equationRow]
      })
    }

    const highlights: number[] = parseRangeString(lines.length + startLine - 1, rangeStr)
    lines.forEach((line, idx) => {
      const highlighted = highlights.includes(idx + startLine)
      line.forEach((node) => {
        node.classList.toggle(CLASS_VCLICK_TARGET, true)
        node.classList.toggle('highlighted', highlighted)
        node.classList.toggle('dishonored', !highlighted)
      })
    })
  }, [clicksValue, index, ranges, finallyRange, startLine])

  return (
    <div ref={el} className="slidev-katex-wrapper">
      {children}
    </div>
  )
}

export default KaTexBlockWrapper
