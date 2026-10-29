/**
 * Mermaid component for React
 * Port of Vue client builtin/Mermaid.vue
 *
 * Renders mermaid diagrams with shadow DOM.
 * (auto transformed, you don't need to use this component directly)
 *
 * Usage in markdown:
 * ```mermaid
 * pie
 * "Dogs" : 386
 * "Cats" : 85
 * "Rats" : 15
 * ```
 */

import lz from 'lz-string'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { ShadowRoot } from '../internals/ShadowRoot'
import { renderMermaid } from '../modules/mermaid'

export interface MermaidProps {
  codeLz: string
  /** lz-compressed JS object literal with fence options, e.g. `{scale: 0.5}` */
  optionsLz?: string
  scale?: number
  theme?: string
  [key: string]: unknown
}

function decodeOptions(optionsLz?: string): Record<string, unknown> {
  if (!optionsLz)
    return {}
  try {
    const literal = lz.decompressFromBase64(optionsLz) || '{}'
    // The fence options are a JS object literal (same trust level as the
    // deck markdown itself, evaluated by Vue's v-bind in the Vue client).
    // eslint-disable-next-line no-new-func
    return new Function(`return (${literal})`)() ?? {}
  }
  catch {
    return {}
  }
}

export function Mermaid({ codeLz, optionsLz, scale: scaleProp, theme: themeProp, ...attrs }: MermaidProps) {
  const fenceOptions = useMemo(() => decodeOptions(optionsLz), [optionsLz])
  const scale = (fenceOptions.scale as number | undefined) ?? scaleProp
  const theme = (fenceOptions.theme as string | undefined) ?? themeProp
  // Subscribed dark-mode state: re-runs the render effect on toggle (the
  // previous `isDark.value` dep was a plain getter React never tracked).
  const { isDark } = useDarkMode()
  const shadowRef = useRef<HTMLElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [html, setHtml] = useState('')
  const [actualHeight, setActualHeight] = useState<number | undefined>()

  // Render mermaid diagram
  useEffect(() => {
    let disposed = false

    async function render() {
      setError(null)
      try {
        const { scale: _scale, theme: _theme, ...fenceRest } = fenceOptions
        const svg = await renderMermaid(
          codeLz || '',
          {
            ...fenceRest,
            theme: theme || (isDark ? 'dark' : undefined),
            ...attrs,
          },
        )
        if (!disposed) {
          setHtml(svg)
          setActualHeight(undefined)
        }
      }
      catch (e) {
        setError(`${e}`)
        console.warn(e)
      }
    }

    render()

    return () => {
      disposed = true
    }
  }, [codeLz, theme, isDark, fenceOptions])

  // Extract actual height from SVG viewBox
  useEffect(() => {
    if (shadowRef.current && actualHeight == null) {
      const svgEl = shadowRef.current.children?.[0] as SVGElement | undefined
      if (svgEl && svgEl.hasAttribute('viewBox')) {
        const v = Number.parseFloat(svgEl.getAttribute('viewBox')?.split(' ')[3] || '')
        if (!Number.isNaN(v)) {
          setActualHeight(v)
        }
      }
    }
  }, [html])

  // Apply scale to SVG
  useEffect(() => {
    if (shadowRef.current && scale != null && actualHeight != null) {
      const svgEl = shadowRef.current.children?.[0] as SVGElement | undefined
      if (svgEl) {
        svgEl.setAttribute('height', `${actualHeight * scale}`)
        svgEl.removeAttribute('width')
        svgEl.removeAttribute('style')
      }
    }
  }, [html, scale, actualHeight])

  if (error) {
    return (
      <pre className="pa-3 text-wrap" style={{ border: '1px solid red', borderRadius: '4px' }}>
        {error}
      </pre>
    )
  }

  return (
    <ShadowRoot
      className="mermaid"
      innerHTML={html}
      onShadow={(el) => { shadowRef.current = el }}
    />
  )
}

export default Mermaid
