/**
 * PlantUml component for React
 * Port of Vue client builtin/PlantUml.vue
 *
 * PlantUML
 * (auto transformed, you don't need to use this component directly)
 *
 * Usage in markdown:
 * ```plantuml
 * @startuml
 * Alice -> Bob : Hello!
 * @enduml
 * ```
 */

import { useMemo } from 'react'
import { decodeLzObject } from './lzProps'

export interface PlantUmlProps {
  code: string
  server: string
  /** lz-compressed options object from the markdown pipeline */
  optionsLz?: string
  scale?: number
  alt?: string
}

export function PlantUml(rawProps: PlantUmlProps) {
  const fenceOptions = decodeLzObject(rawProps.optionsLz)
  const { code, server, scale, alt = 'PlantUML diagram' } = { ...fenceOptions, ...rawProps } as PlantUmlProps
  const uri = useMemo(() => `${server}/svg/${code}`, [server, code])

  return (
    <img
      src={uri}
      style={scale ? { transform: `scale(${scale})` } : undefined}
      alt={alt}
    />
  )
}

export default PlantUml
