/**
 * ShikiMagicMove component for React
 * Port of Vue client builtin/ShikiMagicMove.vue
 *
 * Animated code transitions with Shiki
 */

import type { KeyedTokensInfo } from 'shiki-magic-move/types'
import type { ReactNode } from 'react'
import lz from 'lz-string'
import { syncTokenKeys, toKeyedTokens } from 'shiki-magic-move/core'
import { ShikiMagicMoveRenderer } from 'shiki-magic-move/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNav } from '../hooks/useNav'
import { useSlideContext } from '../context'
import { configs } from '../env'
import { useClicksValue } from '../hooks/useClicks'
import { TitleIcon } from '../internals/TitleIcon'
import { makeId, updateCodeHighlightRange } from '../logic/utils'
import { decodeLzObject, decodeLzString } from './lzProps'
import 'shiki-magic-move/dist/style.css'
import './ShikiMagicMove.css'

export interface ShikiMagicMoveProps {
  at?: string | number
  stepsLz: string
  stepRanges?: string[][]
  stepRangesLz?: string
  optionsLz?: string
  titleLz?: string
  lines?: boolean
  title?: string
  duration?: number
  children?: ReactNode
}

export function ShikiMagicMove(props: ShikiMagicMoveProps) {
  const options = useMemo(() => decodeLzObject(props.optionsLz), [props.optionsLz])
  const at = props.at ?? (typeof options.at === 'number' || typeof options.at === 'string' ? options.at : '+1')
  const title = props.title ?? decodeLzString(props.titleLz)
  const duration = props.duration ?? (typeof options.duration === 'number' ? options.duration : configs.magicMoveDuration)
  const { stepsLz } = props
  const stepRanges = useMemo(() => props.stepRanges ?? JSON.parse(decodeLzString(props.stepRangesLz) || '[]') as string[][], [props.stepRanges, props.stepRangesLz])
  const steps = useMemo(() => JSON.parse(lz.decompressFromBase64(stepsLz)) as KeyedTokensInfo[], [stepsLz])
  const { $clicksContext: clicks, $scale: scale, $zoom: zoom, $frontmatter } = useSlideContext()
  const clicksValue = useClicksValue()
  const { isPrintMode } = useNav()
  const id = useRef(makeId())
  const registeredRef = useRef(false)
  const clicksInfoRef = useRef<{ start: number } | null>(null)

  const [clickStart, setClickStart] = useState(1)
  const [isFirstTick, setIsFirstTick] = useState(true)
  useEffect(() => { setIsFirstTick(false) }, [])
  const container = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  // Normalized the ranges, to at least have one range
  const ranges = useMemo(() => stepRanges.map(i => i.length ? i : ['all']), [stepRanges])

  const { stepIndex, rangeStr } = useMemo(() => {
    const clickCount = clicksValue - clickStart
    let offset = 0
    for (let step = 0; step < ranges.length; step++) {
      if (clickCount < offset + ranges[step].length - 1)
        return { stepIndex: step, rangeStr: ranges[step][clickCount - offset + 1] ?? 'all' }
      offset += ranges[step].length
    }
    return { stepIndex: steps.length - 1, rangeStr: 'all' }
  }, [clicksValue, clickStart, ranges, steps.length])

  const applyHighlights = useCallback(() => {
    const pre = container.current?.querySelector('.shiki')
    if (!pre) return
    const groups: Element[][] = [[]]
    for (const el of Array.from(pre.children).slice(1)) {
      if (el.classList.contains('shiki-magic-move-leave')) continue
      if (el.tagName === 'BR') groups.push([])
      else groups[groups.length - 1].push(el)
    }
    updateCodeHighlightRange(rangeStr, groups.length, 1, line => groups[line])
  }, [rangeStr])
  useEffect(applyHighlights, [applyHighlights, stepIndex])

  const showCopyButton = useMemo(() => {
    if (!($frontmatter.codeCopy ?? configs.codeCopy))
      return false

    const magicCopy = $frontmatter.magicMoveCopy ?? configs.magicMoveCopy
    if (!magicCopy)
      return false

    if (magicCopy === true || magicCopy === 'always')
      return true

    if (magicCopy === 'final')
      return stepIndex === steps.length - 1

    return false
  }, [stepIndex, steps.length, $frontmatter.codeCopy, $frontmatter.magicMoveCopy])

  const copyCode = useCallback(() => {
    const currentStep = steps[stepIndex]
    if (!currentStep || !currentStep.code)
      return

    navigator.clipboard.writeText(currentStep.code.trim()).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    }).catch(error => console.error('Could not copy code', error))
  }, [steps, stepIndex])

  // Register clicks once on mount (Vue parity: onMounted)
  useLayoutEffect(() => {
    if (!clicks || registeredRef.current)
      return

    if (ranges.length !== steps.length)
      throw new Error('[slidev] The length of stepRanges does not match the length of steps, this is an internal error.')

    const clickCounts = ranges.map(s => s.length).reduce((a, b) => a + b, 0)
    const clickInfo = clicks.calculateSince(at, clickCounts - 1)
    if (clickInfo) {
      clicks.register(id.current, clickInfo)
      clicksInfoRef.current = clickInfo
      setClickStart(clickInfo.start)
      registeredRef.current = true
    }

    return () => {
      clicks?.unregister(id.current)
      registeredRef.current = false
      clicksInfoRef.current = null
    }
  }, [clicks, ranges, steps, at])

  const globalScale = (scale ?? 1) * (zoom ?? 1)
  const animationOptions = useMemo(() => ({ globalScale, duration: isFirstTick ? 0 : duration, stagger: 1 }), [globalScale, duration, isFirstTick])
  const previous = useRef(toKeyedTokens('', []))
  const tokens = useMemo(() => {
    const result = syncTokenKeys(previous.current, steps[stepIndex])
    return result
  }, [steps, stepIndex])
  useLayoutEffect(() => { previous.current = tokens.to }, [tokens])

  return (
    <div ref={container} className="slidev-code-wrapper slidev-code-magic-move relative group">
      {title && (
        <div className="slidev-code-block-title">
          <TitleIcon title={title} />
          <div className="leading-1em">
            {title.replace(/~([^~]+)~/g, '').trim()}
          </div>
        </div>
      )}
      <ShikiMagicMoveRenderer
        className="slidev-code relative shiki overflow-visible"
        tokens={tokens.to}
        previous={tokens.from}
        animate={!isPrintMode}
        options={animationOptions}
        onEnd={applyHighlights}
      />
      {showCopyButton && (
        <button
          className={`slidev-code-copy absolute right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100 ${title ? 'top-10' : 'top-0'}`}
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

export default ShikiMagicMove
