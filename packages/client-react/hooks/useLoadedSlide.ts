import type { SlideRoute } from '@slidev/types'
import { useLayoutEffect, useState } from 'react'

/** Keep the previous frame visible until the requested slide module is ready. */
export function useLoadedSlide<T extends { route: SlideRoute }>(frame: T | null): T | null {
  const [loadedFrame, setLoadedFrame] = useState<T | null>(null)

  useLayoutEffect(() => {
    if (!frame)
      return

    let cancelled = false
    // The canonical route loader caches both successful modules and SlideError.
    // Cancel only this display request, leaving the shared preload intact.
    void frame.route.load().then(() => {
      if (!cancelled)
        setLoadedFrame(frame)
    })
    return () => { cancelled = true }
  }, [frame])

  // Click-only changes on a ready slide do not need another asynchronous render.
  return !frame || frame.route === loadedFrame?.route ? frame : loadedFrame
}
