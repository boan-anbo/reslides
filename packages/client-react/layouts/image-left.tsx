/**
 * Image-left layout for React
 * Port of Vue client layouts/image-left.vue
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { handleBackground } from '../layoutHelper'

export interface ImageLeftLayoutProps {
  image?: string
  class?: string
  backgroundSize?: string
  children?: ReactNode
}

export default function ImageLeftLayout({ image, class: className, backgroundSize = 'cover', children }: ImageLeftLayoutProps) {
  const style = useMemo(() => handleBackground(image, false, backgroundSize), [image, backgroundSize])

  return (
    <div className="grid grid-cols-2 w-full h-full auto-rows-fr">
      <div className="w-full h-full" style={style} />
      <div className={`slidev-layout default ${className || ''}`}>
        {children}
      </div>
    </div>
  )
}
