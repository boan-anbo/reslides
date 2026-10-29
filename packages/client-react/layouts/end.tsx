/**
 * End layout for React
 * Port of Vue client layouts/end.vue
 */

import type { ReactNode } from 'react'

export interface EndLayoutProps {
  children?: ReactNode
}

export default function EndLayout({ children }: EndLayoutProps) {
  return (
    <div className="slidev-layout end text-white text-opacity-85 text-xl tracking-widest bg-black h-full text-center grid place-content-center select-none">
      {children || 'END'}
    </div>
  )
}
