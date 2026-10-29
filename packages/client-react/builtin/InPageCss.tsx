/**
 * InPageCss - runtime injection for `<style>` blocks written in slide
 * markdown. Raw <style> children are unrepresentable in JSX (CSS braces
 * parse as expressions), so the node pipeline lz-encodes the CSS into a
 * prop (see node/syntax/transform-react/wrappers.ts).
 *
 * The compiler scopes these rules with the same IDs as the slide's elements.
 */
import { useInsertionEffect, useMemo } from 'react'
import { decodeLzString } from './lzProps'

export interface InPageCssProps {
  cssLz: string
}

export function InPageCss({ cssLz }: InPageCssProps) {
  const css = useMemo(() => decodeLzString(cssLz), [cssLz])

  useInsertionEffect(() => {
    if (!css)
      return
    const el = document.createElement('style')
    el.dataset.slidevInPageCss = ''
    el.textContent = css
    document.head.appendChild(el)
    return () => {
      document.head.removeChild(el)
    }
  }, [css])

  return null
}

export default InPageCss
