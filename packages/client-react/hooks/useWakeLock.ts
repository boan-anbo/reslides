import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseWakeLockResult {
  isSupported: boolean
  isActive: boolean
  request: () => Promise<void>
  release: () => Promise<void>
}

/** Keep presenting after permission denial; release even a late permission grant. */
export function useWakeLock(enabled = false): UseWakeLockResult {
  const [isActive, setIsActive] = useState(false)
  const lockRef = useRef<WakeLockSentinel | null>(null)
  const generation = useRef(0)
  const pending = useRef(false)
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const release = useCallback(async () => {
    generation.current++
    const lock = lockRef.current
    lockRef.current = null
    setIsActive(false)
    await lock?.release().catch(() => {})
  }, [])
  const request = useCallback(async () => {
    if (!isSupported || pending.current || document.visibilityState !== 'visible' || (lockRef.current && !lockRef.current.released)) return
    const requestedGeneration = generation.current
    pending.current = true
    try {
      const lock = await navigator.wakeLock.request('screen')
      if (requestedGeneration !== generation.current) {
        await lock.release().catch(() => {})
        return
      }
      lockRef.current = lock
      setIsActive(true)
      lock.addEventListener('release', () => {
        if (lockRef.current === lock) {
          lockRef.current = null
          setIsActive(false)
        }
      }, { once: true })
    }
    catch { /* Permission/policy denial is a normal browser capability limit. */ }
    finally { pending.current = false }
  }, [isSupported])
  useEffect(() => {
    if (!enabled) { void release(); return }
    void request()
    const visible = () => { if (document.visibilityState === 'visible') void request() }
    document.addEventListener('visibilitychange', visible)
    return () => {
      document.removeEventListener('visibilitychange', visible)
      void release()
    }
  }, [enabled, request, release])
  return { isSupported, isActive, request, release }
}
