import type { VirtualModuleTemplateReact } from './types'
import { objectMap } from '@antfu/utils'
import { toAtFS } from '../resolver'

/**
 * React virtual module for layout components
 * Parallel to packages/slidev/node/virtual/layouts.ts
 *
 * Note: Layout paths are resolved from utils.getLayouts().
 * In React framework mode, utils.getLayouts() should prefer layouts-react/*
 * when available.
 */
export const templateLayoutsReact: VirtualModuleTemplateReact = {
  id: '/@slidev/layouts-react',
  async getContent({ utils }) {
    const imports: string[] = []
    const layouts = objectMap(
      await utils.getLayouts(),
      (k, v) => {
        imports.push(`import __layout_${k} from "${toAtFS(v)}"`)
        return [k, `__layout_${k}`]
      },
    )

    return [
      imports.join('\n'),
      ``,
      `const layouts = {\n${Object.entries(layouts).map(([k, v]) => `  "${k}": ${v}`).join(',\n')}\n}`,
      ``,
      `export default layouts`,
    ].join('\n')
  },
}
