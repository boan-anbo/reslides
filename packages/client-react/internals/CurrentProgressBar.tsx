/**
 * CurrentProgressBar component for React
 * Port of Vue client internals/CurrentProgressBar.vue
 */

import type { ClicksContext } from '@slidev/types'
import { useNav } from '../hooks/useNav'

export interface CurrentProgressBarProps {
  clicksContext?: ClicksContext
  current?: number
}

export function CurrentProgressBar({
  clicksContext: propClicksContext,
  current: propCurrent,
}: CurrentProgressBarProps) {
  const nav = useNav()
  const clicksContext = propClicksContext ?? nav.clicksContext
  const current = propCurrent ?? nav.currentSlideNo
  const { total } = nav

  return (
    <div className="relative flex gap-px">
      {Array.from({ length: total - 1 }, (_, idx) => {
        const i = idx + 1
        return (
          <div
            key={i}
            className={`border-x border-b border-main h-1 transition-all ${i < current ? 'bg-primary border-primary' : ''}`}
            style={{ width: `${(1 / (total - 1) * 100)}%` }}
          >
            {i === current && (
              <div
                className="h-full bg-primary opacity-75 transition-all"
                style={{
                  width: `${clicksContext.total === 0 ? 0 : clicksContext.current / (clicksContext.total + 1) * 100}%`,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
