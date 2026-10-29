import type { VirtualModuleTemplateReact } from './types'
import { join } from 'node:path'
import { resolveImportUrl, toAtFS } from '../resolver'
import { makeAbsoluteImportGlob } from '../utils'

/**
 * React virtual module for styles
 * Parallel to packages/slidev/node/virtual/styles.ts
 *
 * Imports global CSS styles including:
 * - UnoCSS (reset, preflights, typography, shortcuts, utilities)
 * - Client styles (vars, index, code, katex, transitions)
 * - Theme styles
 * - User styles
 * - KaTeX and Shiki CSS when features are enabled
 */
export const templateStyleReact: VirtualModuleTemplateReact = {
  id: '/@slidev/styles-react',
  async getContent({ data, clientRoot, userRoot, roots }) {
    // For React, we use @slidev/client-react for styles
    // But most CSS is shared with Vue client
    function resolveUrlOfClient(name: string) {
      return toAtFS(join(clientRoot, name))
    }

    const imports: string[] = [
      `import "${resolveUrlOfClient('styles/vars.css')}"`,
      `import "${resolveUrlOfClient('styles/index.css')}"`,
      `import "${resolveUrlOfClient('styles/code.css')}"`,
      `import "${resolveUrlOfClient('styles/katex.css')}"`,
      `import "${resolveUrlOfClient('styles/transitions.css')}"`,
    ]

    // Import theme/user styles from roots
    for (const root of roots) {
      imports.push(makeAbsoluteImportGlob(userRoot, [
        join(root, 'styles/index.{ts,js,css}'),
        join(root, 'styles.{ts,js,css}'),
        join(root, 'style.{ts,js,css}'),
      ]))
    }

    // KaTeX CSS
    if (data.features.katex)
      imports.push(`import "${await resolveImportUrl('katex/dist/katex.min.css')}"`)

    // Shiki CSS
    if (data.config.highlighter === 'shiki') {
      imports.push(
        `import "${await resolveImportUrl('@shikijs/vitepress-twoslash/style.css')}"`,
        `import "${resolveUrlOfClient('styles/shiki-twoslash.css')}"`,
        `import "${await resolveImportUrl('shiki-magic-move/style.css')}"`,
      )
    }

    // UnoCSS at the beginning
    imports.unshift(
      `import "${await resolveImportUrl('@unocss/reset/tailwind.css')}"`,
      'import "uno:preflights.css"',
      'import "uno:typography.css"',
      'import "uno:shortcuts.css"',
    )
    imports.push('import "uno.css"')

    return imports.join('\n')
  },
}
