/**
 * Iframe layout for React
 * Port of Vue client layouts/iframe.vue
 */

import { useMemo } from 'react'

export interface IframeLayoutProps {
  url: string
  scale?: number
}

export default function IframeLayout({ url, scale }: IframeLayoutProps) {
  const scaleInvertPercent = useMemo(() => `${(1 / (scale || 1)) * 100}%`, [scale])

  return (
    <div className="h-full w-full">
      <div className="relative" style={{ width: scaleInvertPercent, height: scaleInvertPercent }}>
        <iframe
          id="frame"
          className="w-full h-full"
          src={url}
          style={scale ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}}
        />
      </div>
    </div>
  )
}
