/**
 * React variants of the Vue wrapper transforms
 * (../transform/code-wrapper.ts, katex-wrapper.ts, plant-uml.ts,
 * in-page-css.ts, mermaid.ts).
 *
 * The Vue emits use template syntax (`v-bind="{...}"`, `:ranges='[...]'`)
 * which is invalid HTML: markdown-it splits such tags apart and the brace
 * payloads leak into JSX children. The React variants keep every attribute
 * a plain HTML string - object/array payloads are lz-compressed and decoded
 * by the client component (see packages/client-react/builtin/lzProps.ts).
 */
import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'
import { encode as encodePlantUml } from 'plantuml-encoder'
import { compileStyleAsync } from 'vue/compiler-sfc'
import { reCodeBlock } from '../transform/code-wrapper'
import { getCodeBlocks, getCommentBlocks, normalizeRangeStr } from '../transform/utils'

function lzAttr(value: string): string {
  return lz.compressToBase64(value)
}

/**
 * Transform code blocks with the CodeBlockWrapper component (line ranges /
 * click highlighting). Mirror of ../transform/code-wrapper.ts.
 */
export function transformCodeWrapperReact(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    reCodeBlock,
    (full, lang = '', title = '', rangeStr = '', options = '', attrs = '', code: string) => {
      const ranges = normalizeRangeStr(rangeStr)
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `\n<CodeBlockWrapper rangesRaw="${ranges.join('|')}" titleLz="${lzAttr(title)}" optionsLz="${lzAttr(options)}">\n\n\`\`\`${lang}${title ? ` [${title}]` : ''}${attrs ? ` ${attrs.trim()}` : ''}\n${code}\n\`\`\`\n\n</CodeBlockWrapper>`
    },
  )
}

/**
 * Wrap KaTeX `$$...$$` blocks for click highlighting.
 * Mirror of ../transform/katex-wrapper.ts.
 */
export function transformKaTexWrapperReact(ctx: MarkdownTransformContext) {
  ctx.s.replace(
    /^\$\$(?:\s*\{([\w*,|-]+)\}\s*?(?:(\{[^}]*\})\s*?)?)?\n(\S[\s\S]*?)^\$\$/gm,
    (full, rangeStr: string = '', options = '', code: string) => {
      const ranges = !rangeStr.trim() ? [] : rangeStr.trim().split(/\|/g).map(i => i.trim())
      code = code.trimEnd()
      options = options.trim() || '{}'
      return `<KaTexBlockWrapper rangesRaw="${ranges.join('|')}" optionsLz="${lzAttr(options)}">\n\n$$\n${code}\n$$\n</KaTexBlockWrapper>\n`
    },
  )
}

/**
 * Transform plantuml fences into <PlantUml /> components.
 * Mirror of ../transform/plant-uml.ts.
 */
export function transformPlantUmlReact(ctx: MarkdownTransformContext) {
  const server = ctx.options.data.config.plantUmlServer
  ctx.s.replace(
    /^```plantuml[^\n{}]*(\{[^}\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, options = '', content = '') => {
      const code = encodePlantUml(content.trim())
      options = options.trim() || '{}'
      return `<PlantUml code="${code}" server="${server}" optionsLz="${lzAttr(options)}" />`
    },
  )
}

/**
 * Transform `<style>` blocks in markdown into <InPageCss /> components.
 * Raw <style> children are unrepresentable in JSX (CSS braces parse as
 * expressions); the component injects a real style tag at runtime.
 * Reuse Vue's scoped CSS compiler, including :deep(), :global() and keyframes.
 */
export async function transformInPageCssReact(ctx: MarkdownTransformContext) {
  const codeBlocks = getCodeBlocks(ctx.s.original)
  const commentBlocks = getCommentBlocks(ctx.s.original)

  const replacements: [number, number, string][] = []
  ctx.s.replace(
    /\n<style[^>]*>([\s\S]+?)<\/style>/g,
    (full, css, index) => {
      if (codeBlocks.isInsideCodeblocks(index))
        return full
      if (commentBlocks.isInsideCommentBlocks(index))
        return ''
      replacements.push([index, index + full.length, css])
      return full
    },
  )
  for (const [start, end, css] of replacements) {
    const result = await compileStyleAsync({
      source: css,
      filename: ctx.slide.source.filepath,
      id: `data-v-slidev-${ctx.slide.index + 1}`,
      scoped: true,
    })
    if (result.errors.length)
      throw new Error(`Slide CSS: ${result.errors.map(String).join('\n')}`)
    ctx.s.overwrite(start, end, `\n<InPageCss cssLz="${lzAttr(result.code)}" />`)
  }
}
