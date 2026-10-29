import type { ResolvedSlidevOptions } from '@slidev/types'
import type { PluginContext } from 'rollup'

/**
 * React virtual module template interface
 * Parallel to packages/slidev/node/virtual/types.ts
 */
export interface VirtualModuleTemplateReact {
  id: string
  getContent: (this: PluginContext, ctx: ResolvedSlidevOptions) => string | Promise<string>
}
