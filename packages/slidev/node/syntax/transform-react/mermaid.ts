import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'

/**
 * Transform ```mermaid fences into <Mermaid codeLz="..." /> components.
 * Mirror of ../transform/mermaid.ts (Vue), with React prop casing.
 *
 * Options are lz-encoded as well: a JSX spread (`{...}`) is not valid HTML,
 * so markdown-it would split the tag and leak braces into JSX children.
 * The component decodes optionsLz at render time.
 */
export function transformMermaidReact(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    /^```mermaid *(\{[^\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, options = '', code = '') => {
      code = code.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      const encodedOptions = lz.compressToBase64(options)
      return `<Mermaid codeLz="${encoded}" optionsLz="${encodedOptions}" />`
    },
  )
}
