/**
 * Fact layout for React
 * Port of Vue client layouts/fact.vue
 */

import type { ReactNode } from 'react'

export interface FactLayoutProps {
  children?: ReactNode
}

export default function FactLayout({ children }: FactLayoutProps) {
  return (
    <div className="slidev-layout fact">
      <div className="my-auto">
        {children}
      </div>
    </div>
  )
}
