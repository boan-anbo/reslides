/**
 * CodeBlockWrapper component for React
 * Port of Vue client builtin/CodeBlockWrapper.vue
 *
 * Line highlighting for code blocks.
 * (auto transformed, you don't need to use this component directly)
 *
 * Usage:
 *
 * ```ts {1,3-5|2,4}
 * const your_code = 'here'
 * ```
 *
 * Learn more: https://sli.dev/guide/syntax.html#line-highlighting
 */

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CLASS_VCLICK_HIDDEN, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { useClicksValue } from '../hooks/useClicks'
import { configs } from '../env'
import { TitleIcon } from '../internals/TitleIcon'
import { makeId, updateCodeHighlightRange } from '../logic/utils'
import { decodeLzObject, decodeLzString, parseRangesRaw } from './lzProps'
import { useActiveTitle } from './CodeGroup'
import './CodeBlockWrapper.css'

export interface CodeBlockWrapperProps {
  ranges?: string[]
  /** pipe-joined ranges from the markdown pipeline ("1,2|3-4") */
  rangesRaw?: string
  /** lz-compressed fence options object from the markdown pipeline */
  optionsLz?: string
  /** lz-compressed title from the markdown pipeline */
  titleLz?: string
  finally?: string | number
  startLine?: number
  lines?: boolean
  at?: string | number
  maxHeight?: string
  title?: string
  children?: ReactNode
}

export function CodeBlockWrapper(rawProps: CodeBlockWrapperProps) {
  // Merge pipeline-encoded props (see builtin/lzProps.ts): explicit JSX
  // props win over fence options, fence options win over defaults.
  const fenceOptions = decodeLzObject(rawProps.optionsLz)
  const {
    ranges = parseRangesRaw(rawProps.rangesRaw),
    finally: finallyProp = 'last',
    startLine = 1,
    lines = configs.lineNumbers,
    at = '+1',
    maxHeight,
    title = decodeLzString(rawProps.titleLz) || undefined,
    children,
  } = { ...fenceOptions, ...rawProps } as CodeBlockWrapperProps
  const { $clicksContext: clicks, $frontmatter } = useSlideContext()
  const codeCopy = typeof $frontmatter.codeCopy === 'boolean' ? $frontmatter.codeCopy : configs.codeCopy
  const clicksValue = useClicksValue()
  const el = useRef<HTMLDivElement>(null)
  const id = useRef(makeId())
  const [copied, setCopied] = useState(false)
  const registeredRef = useRef(false)
  const clicksInfoRef = useRef<{ start: number } | null>(null)

  // Get active title from CodeGroup context if available
  const activeTitleContext = useActiveTitle()
  const activeTitle = activeTitleContext?.activeTitle ?? null

  const isBlockTitleShow = useMemo(() => {
    return activeTitle === null && title
  }, [activeTitle, title])

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

  // Toggle line numbers class
  useEffect(() => {
    el.current?.classList.toggle('slidev-code-line-numbers', lines)
  }, [lines])

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

    const pre = el.current.querySelector('.shiki')
    if (!pre)
      return

    const lineElements = Array.from(pre.querySelectorAll('code > .line'))
    const linesCount = lineElements.length

    updateCodeHighlightRange(
      rangeStr,
      linesCount,
      startLine,
      no => [lineElements[no]],
    )

    // Scroll to the highlighted line if `maxHeight` is set
    if (maxHeight) {
      const highlightedEls = Array.from(pre.querySelectorAll('.line.highlighted')) as HTMLElement[]
      const height = highlightedEls.reduce((acc, elem) => elem.offsetHeight + acc, 0)
      if (height > el.current.offsetHeight) {
        highlightedEls[0].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      else if (highlightedEls.length > 0) {
        const middleEl = highlightedEls[Math.round((highlightedEls.length - 1) / 2)]
        middleEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [clicksValue, index, ranges, finallyRange, startLine, maxHeight])

  const copyCode = () => {
    const code = el.current?.querySelector('.slidev-code')?.textContent
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div
      ref={el}
      className={`slidev-code-wrapper relative group ${lines ? 'slidev-code-line-numbers' : ''} ${activeTitle === title ? 'active' : ''}`}
      style={{
        maxHeight: maxHeight,
        overflowY: maxHeight ? 'scroll' : undefined,
        // @ts-expect-error CSS custom property
        '--start': startLine,
      }}
      data-title={title}
    >
      {isBlockTitleShow && (
        <div className="slidev-code-block-title">
          <TitleIcon title={title!} />
          <div className="leading-1em">
            {title!.replace(/~([^~]+)~/g, '').trim()}
          </div>
        </div>
      )}
      {children}
      {codeCopy && (
        <button
          className={`slidev-code-copy absolute right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100 ${isBlockTitleShow ? 'top-10' : 'top-0'}`}
          title={copied ? 'Copied' : 'Copy'}
          onClick={copyCode}
        >
          {copied ? (
            <span className="i-ph-check-circle p-2 w-8 h-8" />
          ) : (
            <span className="i-ph-clipboard p-2 w-8 h-8" />
          )}
        </button>
      )}
    </div>
  )
}

export default CodeBlockWrapper
