/**
 * Image-right layout for React
 * Port of Vue client layouts/image-right.vue
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { handleBackground } from '../layoutHelper'

export interface ImageRightLayoutProps {
  image?: string
  class?: string
  backgroundSize?: string
  children?: ReactNode
}

export default function ImageRightLayout({ image, class: className, backgroundSize = 'cover', children }: ImageRightLayoutProps) {
  const style = useMemo(() => handleBackground(image, false, backgroundSize), [image, backgroundSize])

  return (
    <div className="grid grid-cols-2 w-full h-full auto-rows-fr">
      <div className={`slidev-layout default ${className || ''}`}>
        {children}
      </div>
      <div className="w-full h-full" style={style} />
    </div>
  )
}
