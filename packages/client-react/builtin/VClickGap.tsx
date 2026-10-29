/**
 * VClickGap component for React
 * Port of Vue client builtin/VClickGap.vue
 *
 * Adds a gap in the click sequence.
 */

import { useEffect, useRef } from 'react'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'

export interface VClickGapProps {
  size?: string | number
}

export function VClickGap({ size = 1 }: VClickGapProps) {
  const { $clicksContext: clicks } = useSlideContext()
  const idRef = useRef(makeId())

  useEffect(() => {
    let delta = +size
    if (Number.isNaN(delta)) {
      console.warn(`[slidev] Invalid size for VClickGap: ${size}`)
      delta = 1
    }

    const id = idRef.current
    const max = clicks.currentOffset + delta - 1
    clicks.register(id, { max, delta })

    return () => {
      clicks.unregister(id)
    }
  }, [size, clicks])

  return null
}

export default VClickGap
