/**
 * LightOrDark component for React
 * Port of Vue client builtin/LightOrDark.vue
 *
 * Renders different content based on dark mode.
 */

import type { ReactNode } from 'react'
import { isDark } from '../logic/dark'

export interface LightOrDarkProps {
  dark?: ReactNode
  light?: ReactNode
}

export function LightOrDark({ dark, light }: LightOrDarkProps) {
  return (
    <div>
      {isDark.value ? dark : light}
    </div>
  )
}

export default LightOrDark
