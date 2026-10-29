/**
 * Quote layout for React
 * Port of Vue client layouts/quote.vue
 */

import type { ReactNode } from 'react'

export interface QuoteLayoutProps {
  children?: ReactNode
}

export default function QuoteLayout({ children }: QuoteLayoutProps) {
  return (
    <div className="slidev-layout quote">
      <div className="my-auto">
        {children}
      </div>
    </div>
  )
}
