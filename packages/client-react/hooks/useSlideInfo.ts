/**
 * Slide info hook for React
 * Port of Vue client composables/useSlideInfo.ts
 */

import type { SlideInfo, SlidePatch } from '@slidev/types'
import type { SlideMetaInfo } from '../shim'
import { useCallback, useEffect, useState } from 'react'
import { getSlide } from '../logic/slides'

declare const __SLIDEV_HAS_SERVER__: boolean
declare const __DEV__: boolean

export interface UseSlideInfo {
  info: SlideInfo | SlideMetaInfo | null
  update: (data: SlidePatch) => Promise<SlideInfo | void>
}

export function useSlideInfo(no: number): UseSlideInfo {
  const [info, setInfo] = useState<SlideInfo | SlideMetaInfo | null>(() => {
    if (typeof __SLIDEV_HAS_SERVER__ !== 'undefined' && !__SLIDEV_HAS_SERVER__) {
      return getSlide(no)?.meta.slide ?? null
    }
    return null
  })

  const update = useCallback(async (data: SlidePatch): Promise<SlideInfo | void> => {
    if (typeof __SLIDEV_HAS_SERVER__ !== 'undefined' && !__SLIDEV_HAS_SERVER__) {
      return
    }

    const url = `/__slidev/slides/${no}.json`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok)
      throw new Error(`Could not save slide ${no}: HTTP ${response.status}`)
    const newInfo = await response.json()
    setInfo(newInfo)
    return newInfo
  }, [no])

  // Fetch info on mount
  useEffect(() => {
    // Show the current slide's bundled notes immediately, including in builds.
    setInfo(getSlide(no)?.meta.slide ?? null)
    if (typeof __SLIDEV_HAS_SERVER__ !== 'undefined' && !__SLIDEV_HAS_SERVER__) {
      return
    }

    const url = `/__slidev/slides/${no}.json`
    const controller = new AbortController()
    const cancel = () => controller.abort()
    window.addEventListener('pagehide', cancel, { once: true })
    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Could not load slide ${no}: HTTP ${response.status}`)
        return response.json()
      })
      .then(info => { if (!controller.signal.aborted) setInfo(info) })
      .catch(error => { if (!controller.signal.aborted) console.error(error) })
    return () => { cancel(); window.removeEventListener('pagehide', cancel) }
  }, [no])

  // HMR support
  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return

    const hot = import.meta.hot
    if (!hot) return

    const handleSlideUpdate = (payload: { no: number; data: SlideInfo }) => {
      if (payload.no === no) {
        setInfo(payload.data)
      }
    }

    const handleNoteUpdate = (payload: { no: number; note?: string }) => {
      if (payload.no === no && info && info.note?.trim() !== payload.note?.trim()) {
        setInfo(prev => prev ? { ...prev, ...payload } : null)
      }
    }

    hot.on('slidev:update-slide', handleSlideUpdate)
    hot.on('slidev:update-note', handleNoteUpdate)

    return () => {
      hot.off?.('slidev:update-slide', handleSlideUpdate)
      hot.off?.('slidev:update-note', handleNoteUpdate)
    }
  }, [no, info])

  return { info, update }
}

// Cache for slide info instances
const infoCache: Map<number, { info: SlideInfo | null; setInfo: (info: SlideInfo | null) => void }> = new Map()

export function useDynamicSlideInfo(no: number): {
  info: SlideInfo | SlideMetaInfo | null
  update: (data: SlidePatch, newId?: number) => Promise<SlideInfo | void>
} {
  const slideInfo = useSlideInfo(no)

  const update = useCallback(async (data: SlidePatch, newId?: number) => {
    if (newId === undefined || newId === no)
      return slideInfo.update(data)
    const targetNo = newId ?? no
    const url = `/__slidev/slides/${targetNo}.json`

    if (typeof __SLIDEV_HAS_SERVER__ !== 'undefined' && !__SLIDEV_HAS_SERVER__) {
      return
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok)
      throw new Error(`Could not save slide ${targetNo}: HTTP ${response.status}`)
    return response.json()
  }, [no, slideInfo.update])

  return {
    info: slideInfo.info,
    update,
  }
}
