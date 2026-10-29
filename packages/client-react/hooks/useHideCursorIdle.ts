/**
 * Hide cursor when idle hook for React
 * Port of Vue client composables/useHideCursorIdle.ts
 */

import { useCallback, useEffect, useRef } from 'react'

const TIMEOUT = 2000

export function useHideCursorIdle(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    document.body.style.cursor = 'none'
  }, [])

  const show = useCallback(() => {
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    if (!enabled) {
      show()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const handlePointerMove = () => {
      show()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (enabled) {
        timerRef.current = setTimeout(hide, TIMEOUT)
      }
    }

    document.body.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.body.addEventListener('pointerdown', handlePointerMove, { passive: true })

    return () => {
      show()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      document.body.removeEventListener('pointermove', handlePointerMove)
      document.body.removeEventListener('pointerdown', handlePointerMove)
    }
  }, [enabled, hide, show])
}
