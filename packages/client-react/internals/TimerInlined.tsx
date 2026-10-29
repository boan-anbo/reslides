/**
 * TimerInlined component for React
 * Port of Vue client internals/TimerInlined.vue
 */

import { useMemo } from 'react'
import { useTimer } from '../hooks/useTimer'

export function TimerInlined() {
  const { status, percentage, timer, reset, toggle } = useTimer()

  const color = useMemo(() => {
    if (status === 'stopped') return 'opacity-50'
    if (status === 'paused') return 'text-blue-600 dark:text-blue-300'

    if (percentage > 100) return 'text-red-600 dark:text-red-300'
    if (percentage > 80) return 'text-yellow-600 dark:text-yellow-300'
    return 'text-green-600 dark:text-green-300'
  }, [status, percentage])

  return (
    <div data-testid="presenter-timer" data-status={status} className={`flex items-center justify-center pl-4 select-none ${color}`}>
      <div className="flex flex-col items-center">
        <button type="button" title={status === 'running' ? 'Pause timer' : 'Start timer'} aria-label={status === 'running' ? 'Pause timer' : 'Start timer'} className="opacity-80 hover:opacity-100 p-1" onClick={toggle}>
          <div className={status === 'running' ? 'i-carbon:pause' : 'i-carbon:play'} />
        </button>
        <button type="button" title="Reset timer" aria-label="Reset timer" className="opacity-80 hover:opacity-100 p-1" onClick={reset}>
          <div className="i-carbon:renew" />
        </button>
      </div>
      <div role="timer" className="text-3xl px-3 my-auto font-mono">
        {timer.h && (
          <>
            <span>{timer.h}</span>
            <span className="opacity-50">:</span>
          </>
        )}
        <span>{timer.m}</span>
        <span className="opacity-50">:</span>
        <span>{timer.s}</span>
      </div>
    </div>
  )
}
