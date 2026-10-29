/**
 * React virtual modules for Slidev
 * Parallel to packages/slidev/node/virtual/index.ts
 *
 * These modules are generated at build time and provide:
 * - React components for slides
 * - React layout components
 * - Configs (shared with Vue)
 * - Styles (CSS imports)
 */

export * from './types'

export { templateSlidesReact, VIRTUAL_SLIDE_PREFIX_REACT } from './slides'
export { templateLayoutsReact } from './layouts'
export { templateConfigsReact } from './configs'
export { templateStyleReact } from './styles'
export { templateSetupsReact } from './setups'
export { templateGlobalLayersReact } from './global-layers'

import { templateMonacoRunDeps } from '../virtual/monaco-deps'
import { templateMonacoTypes } from '../virtual/monaco-types'
import type { VirtualModuleTemplateReact } from './types'
import { templateConfigsReact } from './configs'
import { templateLayoutsReact } from './layouts'
import { templateSlidesReact } from './slides'
import { templateStyleReact } from './styles'
import { templateSetupsReact } from './setups'
import { templateGlobalLayersReact } from './global-layers'

/**
 * All React virtual module templates
 */
export const templatesReact: VirtualModuleTemplateReact[] = [
  { ...templateMonacoRunDeps, id: `${templateMonacoRunDeps.id}-react` },
  { ...templateMonacoTypes, id: `${templateMonacoTypes.id}-react` },
  templateSlidesReact,
  templateLayoutsReact,
  templateConfigsReact,
  templateStyleReact,
  templateGlobalLayersReact,
  ...templateSetupsReact,
]
