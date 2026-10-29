/**
 * Embedded control hook for React
 * Port of Vue client composables/useEmbeddedCtrl.ts
 *
 * Handles communication with parent window when Slidev is embedded in an iframe.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useNav } from './useNav'
import { useDarkMode } from './useDarkMode'

export function useEmbeddedControl() {
  const nav = useNav()
  const { setDark } = useDarkMode()
  const clientId = useRef(`${Date.now()}`)
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle incoming messages from parent
  useEffect(() => {
    const handleMessage = ({ data }: MessageEvent) => {
      if (data && data.target === 'slidev') {
        if (data.type === 'navigate') {
          if (data.no || data.clicks) {
            nav.go(+data.no, +data.clicks || 0)
          } else if (typeof data.operation === 'string') {
            const fn = nav[data.operation as keyof typeof nav]
            if (typeof fn === 'function') {
              (fn as any)(...(data.args ?? []))
            }
          }
        } else if (data.type === 'css-vars') {
          const root = document.documentElement
          for (const [key, value] of Object.entries(data.vars || {})) {
            root.style.setProperty(key, value as any)
          }
        } else if (data.type === 'color-schema') {
          setDark(data.color === 'dark')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [nav, setDark])

  // Send nav state to parent when embedded
  const postNavState = useCallback(() => {
    if (!nav.isEmbedded) return

    // Throttle to 50ms
    if (throttleTimerRef.current) return
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null
    }, 50)

    window.parent.postMessage(
      {
        target: 'slidev',
        clientId: clientId.current,
        navState: {
          no: nav.currentSlideNo,
          clicks: nav.clicks,
          hasNext: nav.hasNext,
          hasPrev: nav.hasPrev,
        },
      },
      '*',
    )
  }, [nav])

  // Post nav state when it changes
  useEffect(() => {
    if (!nav.isEmbedded) return
    postNavState()
  }, [nav.currentSlideNo, nav.clicks, nav.hasNext, nav.hasPrev, nav.isEmbedded, postNavState])
}
