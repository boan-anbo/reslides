/**
 * Image layout for React
 * Port of Vue client layouts/image.vue
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { handleBackground } from '../layoutHelper'

export interface ImageLayoutProps {
  image?: string
  backgroundSize?: string
  children?: ReactNode
}

export default function ImageLayout({ image, backgroundSize = 'cover', children }: ImageLayoutProps) {
  const style = useMemo(() => handleBackground(image, false, backgroundSize), [image, backgroundSize])

  return (
    <div className="slidev-layout w-full h-full" style={style}>
      {children}
    </div>
  )
}
