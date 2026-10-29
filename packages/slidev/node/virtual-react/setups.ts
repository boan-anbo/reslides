/**
 * React virtual setup modules
 * Ported from packages/slidev/node/virtual/setups.ts
 *
 * DIVERGENCE: IDs use `-react` suffix to avoid collision with Vue setup modules.
 * Alias `#slidev/setups/*` maps to `/@slidev/setups/*-react` for React builds.
 */
import type { VirtualModuleTemplateReact } from './types'
import { join } from 'node:path'
import { makeAbsoluteImportGlob } from '../utils'

function createSetupTemplate(name: string): VirtualModuleTemplateReact {
  return {
    // Use -react suffix to distinguish from Vue setup modules
    id: `/@slidev/setups/${name}-react`,
    getContent({ userRoot, roots }) {
      const globs = roots.map((root) => {
        const glob = join(root, `setup/${name}.{ts,tsx,js,jsx,mts,mjs}`)
        return `Object.values(${makeAbsoluteImportGlob(userRoot, [glob], { import: 'default' })})[0]`
      })
      return `export default [${globs.join(', ')}].filter(Boolean)`
    },
  }
}

// React setup modules - same list as Vue for full parity
// See packages/client/setup/*.ts for implementations
const setupModules = ['shiki', 'code-runners', 'monaco', 'mermaid', 'main', 'root', 'routes', 'shortcuts', 'context-menu']

export const templateSetupsReact = setupModules.map(createSetupTemplate)
