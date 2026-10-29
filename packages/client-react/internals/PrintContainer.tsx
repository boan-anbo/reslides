/**
 * PrintContainer component for React
 * Port of Vue client internals/PrintContainer.vue
 *
 * Container for print mode rendering.
 */

import { useMemo } from 'react'
import { useNav } from '../hooks/useNav'
import { configs, slideAspect, slideWidth } from '../env'
import { PrintSlide } from './PrintSlide'

export interface PrintContainerProps {
  width: number
}

export function PrintContainer({ width }: PrintContainerProps) {
  const { slides, printRange } = useNav()

  const height = useMemo(() => width / slideAspect, [width])
  const screenAspect = useMemo(() => width / height, [width, height])

  const scale = useMemo(() => {
    if (screenAspect < slideAspect) {
      return width / slideWidth
    }
    return (height * slideAspect) / slideWidth
  }, [screenAspect, width, height])

  const className = useMemo(() => ({
    'select-none': !configs.selectable,
  }), [])

  return (
    <div
      id="print-container"
      className={!configs.selectable ? 'select-none' : ''}
    >
      <div id="print-content">
        {printRange.map(no => (
          <PrintSlide
            key={no}
            route={slides[no - 1]}
            scale={scale}
          />
        ))}
      </div>
    </div>
  )
}
