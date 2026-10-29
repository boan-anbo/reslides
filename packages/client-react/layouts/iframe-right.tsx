/**
 * Iframe-right layout for React
 * Port of Vue client layouts/iframe-right.vue
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'

export interface IframeRightLayoutProps {
  url: string
  scale?: number
  /** Vue parity: $attrs (incl. the `class` frontmatter prop) falls through to the content column */
  class?: string
  layoutClass?: string
  children?: ReactNode
}

export default function IframeRightLayout({ url, scale, class: className, layoutClass, children }: IframeRightLayoutProps) {
  const scaleInvertPercent = useMemo(() => `${(1 / (scale || 1)) * 100}%`, [scale])

  return (
    <div className="grid grid-cols-2 w-full h-full">
      <div className={`slidev-layout default ${layoutClass || ''} ${className || ''}`}>
        {children}
      </div>
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
