/**
 * Timer hook for React
 * Port of Vue client composables/useTimer.ts
 */

import { parseTimeString } from '@slidev/parser/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { configs } from '../env'
import type { SharedState } from '../state/shared'
import { useSharedState } from '../state/shared'

export type TimerState = SharedState['timer']

export interface TimerDisplay {
  h: string
  m: string
  s: string
  ms: string
}

export function useTimer() {
  const mode = useMemo(() => configs.timer || 'stopwatch', [])
  const duration = useMemo(() => parseTimeString(configs.duration).seconds, [])

  const [sharedState, { patch }] = useSharedState()
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const state = sharedState.timer

  const status = state.status

  const passedMs = useMemo(() => {
    // Force recalculation on tick
    void tick
    if (state.status === 'stopped' || !state.startedAt) return 0
    if (state.status === 'paused') return state.pausedAt - state.startedAt
    return Date.now() - state.startedAt
  }, [state, tick])

  const passed = passedMs / 1000
  const percentage = duration > 0 ? (passed / duration) * 100 : 0

  const timer: TimerDisplay = useMemo(() => {
    if (mode === 'stopwatch') {
      if (state.status === 'stopped' || !state.startedAt) {
        return { h: '', m: '-', s: '--', ms: '-' }
      }
    }

    const total = mode === 'countdown'
      ? duration * 1000 - passedMs
      : passedMs

    const absolute = Math.abs(total)
    const hours = Math.floor(absolute / 3_600_000)
    let h = hours ? String(hours) : ''
    let min = String(Math.floor(absolute / 60_000) % 60)
    if (hours) min = min.padStart(2, '0')
    if (total < 0) {
      if (h) h = `-${h}`
      else min = `-${min}`
    }
    const sec = String(Math.floor(absolute / 1000) % 60).padStart(2, '0')
    const ms = String(Math.floor((absolute % 1000) / 100))

    return { h, m: min, s: sec, ms }
  }, [mode, duration, passedMs, state])

  // Interval for updating display
  useEffect(() => {
    if (state.status === 'running') {
      intervalRef.current = setInterval(() => {
        setTick(t => t + 1)
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.status])

  const reset = useCallback(() => {
    patch('timer', { status: 'stopped', slides: {}, startedAt: 0, pausedAt: 0 })
  }, [patch])

  const resume = useCallback(() => {
    if (state.status === 'stopped')
      patch('timer', { ...state, status: 'running', startedAt: Date.now() })
    else if (state.status === 'paused')
      patch('timer', { ...state, status: 'running', startedAt: Date.now() - (state.pausedAt - state.startedAt) })
  }, [state, patch])

  const pause = useCallback(() => {
    if (state.status === 'running')
      patch('timer', { ...state, status: 'paused', pausedAt: Date.now() })
  }, [state, patch])

  const toggle = useCallback(() => {
    if (state.status === 'running') {
      pause()
    } else {
      resume()
    }
  }, [state.status, pause, resume])

  return {
    state,
    status,
    timer,
    reset,
    toggle,
    resume,
    pause,
    passed,
    percentage,
    duration,
    mode,
  }
}
