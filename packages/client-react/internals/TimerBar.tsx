/**
 * TimerBar component for React
 * Port of Vue client internals/TimerBar.vue
 */

import { useMemo } from 'react'
import { useTimer } from '../hooks/useTimer'

export function TimerBar() {
  const timer = useTimer()

  const color = useMemo(() => {
    if (timer.status === 'stopped') return 'opacity-50'
    if (timer.status === 'paused') return 'bg-blue-500'

    if (timer.percentage > 100) return 'bg-red-500'
    if (timer.percentage > 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [timer.status, timer.percentage])

  return (
    <div className="border-b mt-px border-main relative flex h-1">
      {timer.status !== 'stopped' && (
        <div
          className={`h-1 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, timer.percentage))}%` }}
        />
      )}
    </div>
  )
}
