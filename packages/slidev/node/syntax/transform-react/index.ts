/**
 * React markdown transformers
 * Parallel to packages/slidev/node/syntax/transform/index.ts
 *
 * These transformers modify markdown content before it's compiled to JSX.
 */

import type { MarkdownTransformer, ResolvedSlidevOptions } from '@slidev/types'
import setupTransformers from '../../setups/transformers'
import { transformSnippet } from '../transform/snippet'
import { transformMonacoReact } from './monaco'
import { transformMermaidReact } from './mermaid'
import { transformMagicMoveReact } from './magic-move'
import { transformCodeWrapperReact, transformInPageCssReact, transformKaTexWrapperReact, transformPlantUmlReact } from './wrappers'

export { transformSlotSugarReact, wrapDefaultSlotReact } from './slot-sugar'
export { transformMermaidReact } from './mermaid'
export { transformCodeWrapperReact, transformInPageCssReact, transformKaTexWrapperReact, transformPlantUmlReact } from './wrappers'

// Re-export shared utilities
export { getCodeBlocks, getCommentBlocks, normalizeRangeStr, escapeVueInCode } from '../transform/utils'

/**
 * Transformer pipeline for React slides, mirroring the Vue order in
 * ../transform/index.ts. Slot sugar runs separately (after these) in
 * vite-react/markdown.ts so the SlotMarker structure stays the last step.
 *
 */
export async function getMarkdownTransformersReact(options: ResolvedSlidevOptions): Promise<(false | MarkdownTransformer)[]> {
  const extras = await setupTransformers(options.roots)
  return [
    ...extras.pre,

    transformSnippet,
    options.data.config.highlighter === 'shiki' && transformMagicMoveReact,

    ...extras.preCodeblock,

    transformMonacoReact,
    transformMermaidReact,
    transformPlantUmlReact,

    ...extras.postCodeblock,

    transformCodeWrapperReact,
    options.data.features.katex && transformKaTexWrapperReact,
    transformInPageCssReact,

    ...extras.post,
  ]
}
