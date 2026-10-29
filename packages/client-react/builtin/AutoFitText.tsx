/**
 * AutoFitText component for React
 * Port of Vue client builtin/AutoFitText.vue
 *
 * [Experimental]
 * Think this component as the TextBox you see in PowerPoint or Keynote.
 * It will automatically resize the font size based on its content to fit them in.
 *
 * Usage:
 * <AutoFitText value="text" />
 * <AutoFitText max={80} min={100} value={text} onChange={setText} />
 */

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import './AutoFitText.css'

export interface AutoFitTextProps {
  value?: string
  onChange?: (value: string) => void
  max?: number
  min?: number
  children?: ReactNode
}

export function AutoFitText({
  value = '',
  onChange,
  max = 100,
  min = 30,
  children,
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(100)
  const [wrap, setWrap] = useState('nowrap')
  const wrapLenRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current || !innerRef.current)
      return

    const containerWidth = containerRef.current.offsetWidth
    const innerWidth = innerRef.current.offsetWidth

    if (innerWidth <= 0)
      return

    const ratio = containerWidth / innerWidth
    if (Number.isNaN(ratio) || ratio <= 0)
      return

    let newSize = size * ratio

    if (newSize < min) {
      wrapLenRef.current = value.length
      setWrap('')
    }
    else {
      if (value.length < wrapLenRef.current) {
        setWrap('nowrap')
      }
    }

    newSize = Math.max(min, Math.min(max, newSize))
    setSize(newSize)
  }, [value, max, min, size])

  return (
    <div
      ref={containerRef}
      className="slidev-auto-fit-text"
      style={{
        fontSize: `${size}px`,
        whiteSpace: wrap as 'nowrap' | 'normal',
      }}
    >
      <div ref={innerRef} className="slidev-auto-fit-text-inner">
        {children || value}
      </div>
    </div>
  )
}

export default AutoFitText
