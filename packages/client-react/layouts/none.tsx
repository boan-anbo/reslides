/**
 * None layout for React
 * Port of Vue client layouts/none.vue
 */

import type { ReactNode } from 'react'

export interface NoneLayoutProps {
  children?: ReactNode
}

export default function NoneLayout({ children }: NoneLayoutProps) {
  return (
    <div>
      {children}
    </div>
  )
}
