/**
 * Statement layout for React
 * Port of Vue client layouts/statement.vue
 */

import type { ReactNode } from 'react'

export interface StatementLayoutProps {
  children?: ReactNode
}

export default function StatementLayout({ children }: StatementLayoutProps) {
  return (
    <div className="slidev-layout statement">
      <div className="my-auto">
        {children}
      </div>
    </div>
  )
}
