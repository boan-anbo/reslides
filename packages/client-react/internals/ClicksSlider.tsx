/**
 * ClicksSlider component for React
 * Port of Vue client internals/ClicksSlider.vue
 */

import type { ClicksContext } from '@slidev/types'
import { clamp, range } from '@antfu/utils'
import { useMemo } from 'react'
import { CLICKS_MAX } from '../constants'
import './ClicksSlider.css'

export interface ClicksSliderProps {
  clicksContext: ClicksContext
  readonly?: boolean
  active?: boolean
}

export function ClicksSlider({
  clicksContext,
  readonly = false,
  active = true,
}: ClicksSliderProps) {
  const total = clicksContext.total
  const start = clamp(0, clicksContext.clicksStart, total)
  const length = total - start + 1
  const current = clicksContext.current > total ? -1 : clicksContext.current

  const clicksRange = useMemo(() => range(start, total + 1), [start, total])

  const handleMousedown = () => {
    if (readonly) return
    if (current < 0 || current > total) {
      clicksContext.current = 0
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clicksContext.current = Number(e.target.value)
  }

  return (
    <div
      className={`flex gap-1 items-center select-none ${length && clicksContext.isMounted ? '' : 'opacity-50'}`}
      title={`Clicks in this slide: ${length}`}
    >
      <div className="flex gap-0.2 items-center min-w-16 font-mono mr-1">
        <div className="i-carbon:cursor-1 text-sm opacity-50" />
        {current >= 0 && current !== CLICKS_MAX && active ? (
          <>
            <div className="flex-auto" />
            <span className="text-primary">{current}</span>
            <span className="opacity-25 text-sm">/</span>
            <span className="opacity-50 text-sm">{total}</span>
          </>
        ) : (
          <div className="opacity-50 flex-auto pl-1">{total}</div>
        )}
      </div>
      <div className="relative flex-auto h-5 font-mono flex">
        {clicksRange.map(i => (
          <div
            key={i}
            className={`border-y border-main overflow-hidden relative ${
              i === 0 ? 'rounded-l border-l' : ''
            } ${
              i === total ? 'rounded-r border-r' : ''
            }`}
            style={{ width: length > 0 ? `${1 / length * 100}%` : '100%' }}
          >
            <div
              className={`absolute inset-0 ${i <= current && active ? 'bg-primary opacity-15' : ''}`}
            />
            <div
              className={`w-full h-full text-xs flex items-center justify-center z-1 ${
                +i === +current && active
                  ? 'text-primary font-bold opacity-100 border-primary'
                  : 'opacity-30 border-main'
              } ${
                i === 0 ? 'rounded-l' : ''
              } ${
                i === total ? 'rounded-r' : 'border-r-2'
              }`}
            >
              {i}
            </div>
          </div>
        ))}
        <input
          className={`clicks-slider-range absolute inset-0 z-label opacity-0 ${readonly ? 'pointer-events-none' : ''}`}
          type="range"
          min={start}
          max={total}
          step={1}
          value={current}
          onChange={handleChange}
          onMouseDown={handleMousedown}
          onFocus={e => e.currentTarget.blur()}
          style={{ '--thumb-width': `${1 / (length + 1) * 100}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
