/**
 * SlidevVideo component for React
 * Port of Vue client builtin/SlidevVideo.vue
 *
 * Video component with auto-play support tied to slide navigation.
 */

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNav } from '../hooks/useNav'
import { useSlideContext } from '../context'

export interface SlidevVideoProps {
  autoplay?: boolean | 'once'
  autoreset?: 'slide' | 'click'
  poster?: string
  printPoster?: string
  timestamp?: string | number
  printTimestamp?: string | number | 'last'
  controls?: boolean
  children?: ReactNode
}

export function SlidevVideo({
  autoplay,
  autoreset,
  poster,
  printPoster: printPosterProp,
  timestamp,
  printTimestamp: printTimestampProp,
  controls,
  children,
}: SlidevVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [played, setPlayed] = useState(false)
  const { $slidev, $renderContext, $route } = useSlideContext()
  const { isPrintMode } = useNav()

  const printPoster = printPosterProp ?? poster
  const printTimestamp = printTimestampProp ?? timestamp ?? 0

  const noPlay = useMemo(() => {
    return isPrintMode.value || !['slide', 'presenter'].includes($renderContext)
  }, [isPrintMode.value, $renderContext])

  // Initialize video timestamp
  useEffect(() => {
    if (noPlay || !videoRef.current)
      return

    const ts = +(timestamp ?? 0)
    videoRef.current.currentTime = ts
  }, [noPlay, timestamp])

  // Auto-play logic
  useEffect(() => {
    if (noPlay || !videoRef.current)
      return

    const ts = +(timestamp ?? 0)
    const matchRoute = !!$route && $route.no === $slidev?.nav.currentSlideNo
    // TODO: Add click resolution check
    const matchClick = true

    if (matchRoute && matchClick) {
      if (autoplay === true || (autoplay === 'once' && !played)) {
        videoRef.current.play()
      }
    }
    else {
      videoRef.current.pause()
      if (autoreset === 'click' || (autoreset === 'slide' && !matchRoute)) {
        videoRef.current.currentTime = ts
      }
    }
  }, [$route, $slidev?.nav.currentSlideNo, autoplay, autoreset, played])

  const handleLoadedMetadata = (ev: React.SyntheticEvent<HTMLVideoElement>) => {
    const element = ev.target as HTMLVideoElement
    if (noPlay && (!printPoster || printTimestampProp)) {
      element.currentTime = printTimestamp === 'last'
        ? element.duration
        : +printTimestamp
    }
  }

  return (
    <video
      ref={videoRef}
      poster={noPlay ? printPoster : poster}
      controls={!noPlay && controls}
      onPlay={() => setPlayed(true)}
      onLoadedMetadata={handleLoadedMetadata}
    >
      {children}
    </video>
  )
}

export default SlidevVideo
