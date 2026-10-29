/**
 * Print styles hook for React
 * Port of Vue client composables/usePrintStyles.ts
 */

import { useEffect, useRef } from 'react'
import { slideHeight, slideWidth } from '../env'
import { useNav } from './useNav'

export function usePrintStyles() {
  const { isPrintMode } = useNav()
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    // Remove previous style if exists
    if (styleRef.current) {
      styleRef.current.remove()
      styleRef.current = null
    }

    if (!isPrintMode) return

    // Create and inject print styles
    const style = document.createElement('style')
    style.textContent = `
@page {
  size: ${slideWidth}px ${slideHeight}px;
  margin: 0px;
}

* {
  transition: none !important;
  transition-duration: 0s !important;
}`
    document.head.appendChild(style)
    styleRef.current = style

    return () => {
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
    }
  }, [isPrintMode])
}

/**
 * Monaco uses `<style media="screen" class="monaco-colors">` to apply colors,
 * which will be ignored in print mode. This patches them.
 */
export function patchMonacoColors() {
  document.querySelectorAll<HTMLStyleElement>('style.monaco-colors').forEach((el) => {
    el.media = ''
  })
}
