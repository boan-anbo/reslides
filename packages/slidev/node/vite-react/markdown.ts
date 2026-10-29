import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import type { MarkdownItAsync } from 'markdown-it-async'
import type { Plugin } from 'vite'
import MagicString from 'magic-string-stack'
import { createMarkdownItAsync } from 'markdown-it-async'
import { useMarkdownItPluginsReact } from '../syntax/markdown-it'
import { getMarkdownTransformersReact, transformSlotSugarReact, wrapDefaultSlotReact } from '../syntax/transform-react'
import { builtinComponentsReact, regexSlideSourceIdReact, toKebabTag } from './common'

/**
 * React Markdown Plugin
 * Parallel to packages/slidev/node/vite/markdown.ts
 *
 * Transforms markdown content to JSX-compatible output using the same
 * node-side machinery as the Vue pipeline:
 * 1. Pre-transforms (snippet, mermaid, plantuml, code-wrapper,
 *    katex-wrapper, in-page-css - see getMarkdownTransformersReact)
 * 2. Slot sugar (:: slotName :: -> <SlotMarker>) + default slot wrapping
 * 3. markdown-it-async render with the shared plugin set (shiki
 *    highlighting, katex, footnotes, task lists, link rewriting)
 * 4. JSX-compatibility pass (brace escaping, class -> className,
 *    void elements, style strings -> objects)
 */
export async function createMarkdownPluginReact(
  options: ResolvedSlidevOptions,
  { markdown: mdOptions }: SlidevPluginOptions,
): Promise<Plugin> {
  const transformers = await getMarkdownTransformersReact(options)

  const md = createMarkdownItAsync({
    quotes: '""\'\'',
    html: true,
    xhtmlOut: true,
    linkify: true,
    ...mdOptions?.markdownItOptions,
  })
  await useMarkdownItPluginsReact(md, options)

  return {
    name: 'slidev:markdown-react',
    enforce: 'pre',

    transform: {
      filter: {
        id: {
          include: regexSlideSourceIdReact,
        },
      },
      async handler(code, id) {
        const match = id.match(regexSlideSourceIdReact)
        if (!match)
          return

        const [, no, ext] = match
        // Only process .tsx files (slide content), not .ts (frontmatter)
        if (ext !== 'tsx')
          return

        const index = +no - 1
        const slide = options.data.slides[index]
        if (!slide)
          return

        // Apply transforms using MagicString
        const s = new MagicString(code)
        const ctx: MarkdownTransformContext = {
          s,
          slide,
          options,
        }

        // 1. Pre-transforms (same registry shape as the Vue pipeline)
        for (const transformer of transformers) {
          if (!transformer)
            continue
          await transformer(ctx)
          if (!ctx.s.isEmpty())
            ctx.s.commit()
        }

        // 2. Slot sugar (:: slotName :: -> <SlotMarker>), then wrap the
        // remaining content in the default slot
        transformSlotSugarReact(ctx)
        if (!ctx.s.isEmpty())
          ctx.s.commit()
        wrapDefaultSlotReact(ctx)
        if (!ctx.s.isEmpty())
          ctx.s.commit()

        // 3. Render markdown between SlotMarker tags
        let content = await processSlotMarkerContent(s.toString(), md)

        // 4. Convert to valid JSX
        content = htmlToJsx(content)

        return {
          code: content,
          map: { mappings: '' },
        }
      },
    },
  }
}

/**
 * Process content that may contain SlotMarker tags
 * Renders markdown between tags while preserving the React components
 */
async function processSlotMarkerContent(content: string, md: MarkdownItAsync): Promise<string> {
  // Regex to match SlotMarker opening/closing tags
  const slotMarkerRegex = /(<SlotMarker[^>]*>)|(<\/SlotMarker>)/g

  const parts: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = slotMarkerRegex.exec(content)) !== null) {
    // Add the markdown content before this tag
    if (match.index > lastIndex) {
      const mdContent = content.slice(lastIndex, match.index)
      parts.push(await renderMarkdownToJsx(mdContent, md))
    }

    // Add the tag itself (unchanged)
    parts.push(match[0])
    lastIndex = match.index + match[0].length
  }

  // Add any remaining content after the last tag
  if (lastIndex < content.length) {
    const mdContent = content.slice(lastIndex)
    parts.push(await renderMarkdownToJsx(mdContent, md))
  }

  return parts.join('')
}

/**
 * Render markdown to JSX-compatible HTML
 */
async function renderMarkdownToJsx(content: string, md: MarkdownItAsync): Promise<string> {
  // HTML comments are passed through by markdown-it (html: true) but are
  // invalid JSX - drop them before any further handling.
  const trimmed = content.replace(/<!--[\s\S]*?-->/g, '').trim()
  if (!trimmed)
    return ''

  // Always render through markdown-it: with html:true it passes raw
  // HTML blocks through untouched and renders the markdown around them,
  // matching the Vue pipeline's semantics.
  //
  // Then escape JSX-hostile braces. Rendered markdown output contains no
  // intentional JSX expressions (our injected components carry payloads in
  // lz-encoded string attributes), so EVERY literal brace - in code
  // blocks, katex annotations, or plain text - must become an entity or
  // babel will parse it as an expression.
  return escapeJsxBraces(await md.renderAsync(trimmed))
}

/**
 * Escape `{` / `}` in rendered HTML text so the output can be inlined into
 * JSX. Attribute VALUES are left alone (braces are legal inside quoted
 * HTML attributes and htmlToJsx's style conversion needs to see them) -
 * only text content between tags is escaped.
 */
function escapeJsxBraces(html: string): string {
  // split into tags and text: tags pass through, text gets escaped
  return html.replace(/(<[^>]*>)|([^<]+)/g, (full, tag, text) => {
    if (tag)
      return tag
    return text
      .replace(/\{/g, '&#123;')
      .replace(/\}/g, '&#125;')
      .replace(/>/g, '&gt;')
  })
}

/**
 * Convert HTML to JSX-compatible syntax
 * - kebab-case built-in component tags -> PascalCase
 * - class -> className
 * - for -> htmlFor
 * - Self-closing tags for void elements
 * - Style string -> style object (basic support)
 */
function htmlToJsx(html: string): string {
  // JSX removes literal newlines between tags, even inside <pre>. Encode
  // preformatted whitespace before JSX compilation so both rendering and
  // copy/paste retain the original code lines and indentation.
  let result = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, block =>
    block.replace(/(<[^>]*>)|([^<]+)/g, (full, tag, text: string) => tag ?? text.replace(/[ \t\r\n]/g, char => `&#${char.charCodeAt(0)};`)))

  // Markdown task lists are static content, not controlled form inputs.
  result = result.replace(/<input\b[^>]*>/gi, tag => /\bclass="[^"]*\btask-list-item-checkbox\b/.test(tag)
    ? tag.replace(/\schecked(?:="[^"]*")?/g, ' defaultChecked').replace(/\sdisabled(?:="[^"]*")?/g, ' disabled')
    : tag)

  // Rename kebab-case built-in component tags to PascalCase so JSX treats
  // them as components instead of inert custom elements (e.g. <v-clicks>
  // -> <VClicks>). Vue resolves both spellings via unplugin-vue-components.
  // Longer names first so `v-clicks` is not half-matched by `v-click`.
  const sortedBuiltins = [...builtinComponentsReact].sort((a, b) => b.length - a.length)
  for (const name of sortedBuiltins) {
    const kebab = toKebabTag(name)
    if (kebab === name.toLowerCase())
      continue
    result = result.replace(new RegExp(`(<\\/?)${kebab}(?=[\\s/>])`, 'g'), `$1${name}`)
  }

  // class → className (but not inside code blocks or strings)
  result = result.replace(/\bclass=/g, 'className=')

  // for → htmlFor (for label elements)
  result = result.replace(/\bfor=/g, 'htmlFor=')

  // Handle self-closing tags for void elements
  const voidElements = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']
  for (const tag of voidElements) {
    // Match <tag ...> (not already self-closed) and convert to <tag ... />
    const regex = new RegExp(`<${tag}(\\s[^>]*)?>(?!\\s*</${tag}>)`, 'gi')
    result = result.replace(regex, (match) => {
      if (match.endsWith('/>'))
        return match
      return match.replace(/>$/, ' />')
    })
  }

  // Handle basic style attribute conversion (style="..." → style={{...}})
  // This is a simplified conversion for common cases
  result = result.replace(/style="([^"]*)"/g, (_, styles) => {
    const styleObj = styles.split(';')
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const segments = s.split(':')
        const key = segments[0].trim()
        // values may legally contain ':' (urls, ratios) - rejoin the rest
        const value = segments.slice(1).join(':').trim()
        // Convert kebab-case to camelCase, preserve CSS custom properties
        const camelKey = key.startsWith('--')
          ? key
          : key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
        return `${JSON.stringify(camelKey)}: ${JSON.stringify(value)}`
      })
      .join(', ')
    return `style={{${styleObj}}}`
  })

  return result
}
