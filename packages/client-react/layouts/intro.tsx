/**
 * Intro layout for React
 * Port of Vue client layouts/intro.vue
 */

import type { ReactNode } from 'react'

export interface IntroLayoutProps {
  children?: ReactNode
}

export default function IntroLayout({ children }: IntroLayoutProps) {
  return (
    <div className="slidev-layout intro">
      {children}
    </div>
  )
}
