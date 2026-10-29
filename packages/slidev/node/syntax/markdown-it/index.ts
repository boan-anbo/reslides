import type { ResolvedSlidevOptions } from '@slidev/types'
import type MagicString from 'magic-string'
import type { MarkdownItAsync } from 'markdown-it-async'
import { taskLists as MarkdownItTaskList } from '@hedgedoc/markdown-it-plugins'
// @ts-expect-error missing types
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMdc from 'markdown-it-mdc'
import MarkdownItEscapeInlineCode from './markdown-it-escape-code'
import MarkdownItKatex from './markdown-it-katex'
import MarkdownItLink from './markdown-it-link'
import MarkdownItShiki from './markdown-it-shiki'
import MarkdownItVDrag from './markdown-it-v-drag'

export async function useMarkdownItPlugins(md: MarkdownItAsync, options: ResolvedSlidevOptions, markdownTransformMap: Map<string, MagicString>) {
  const { data: { features, config }, utils: { katexOptions } } = options

  if (config.highlighter === 'shiki') {
    md.use(await MarkdownItShiki(options))
  }

  md.use(MarkdownItLink)
  md.use(MarkdownItEscapeInlineCode)
  md.use(MarkdownItFootnote)
  md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
  if (features.katex)
    md.use(MarkdownItKatex, katexOptions)
  md.use(MarkdownItVDrag, markdownTransformMap)
  if (config.mdc)
    md.use(MarkdownItMdc)
}

/**
 * Plugin set for the React client. Same as the Vue set except:
 * - MarkdownItEscapeInlineCode: adds `v-pre` (a Vue directive) to inline
 *   code; the React pipeline escapes JSX braces globally instead
 * - MarkdownItVDrag: rewrites markdown into Vue v-drag directive usage
 * - MarkdownItMdc: emits Vue component syntax
 */
export async function useMarkdownItPluginsReact(md: MarkdownItAsync, options: ResolvedSlidevOptions) {
  const { data: { features, config }, utils: { katexOptions } } = options

  if (config.highlighter === 'shiki') {
    md.use(await MarkdownItShiki(options))
  }

  md.use(MarkdownItLink)
  md.use(MarkdownItFootnote)
  md.use(MarkdownItTaskList, { enabled: true, lineNumber: true, label: true })
  if (features.katex)
    md.use(MarkdownItKatex, katexOptions)
}
