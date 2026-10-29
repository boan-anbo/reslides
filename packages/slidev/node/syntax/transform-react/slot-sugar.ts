import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks, getCommentBlocks } from '../transform/utils'

/**
 * Transform slot sugar syntax for React
 * Parallel to packages/slidev/node/syntax/transform/slot-sugar.ts
 *
 * Transforms:
 * ```markdown
 * :: slotName ::
 * content
 * ```
 *
 * Into:
 * ```jsx
 * <SlotMarker name="slotName">
 * content
 * </SlotMarker>
 * ```
 *
 * The SlotMarker component is then processed by the layout wrapper
 * to extract named slots and pass them to the layout component.
 */
export function transformSlotSugarReact(
  ctx: MarkdownTransformContext,
) {
  const linesWithNewline = ctx.s.original.split(/(\r?\n)/g)
  const codeBlocks = getCodeBlocks(ctx.s.original)
  const commentBlocks = getCommentBlocks(ctx.s.original)

  const lines: string[] = []
  for (let i = 0; i < linesWithNewline.length; i += 2) {
    const line = linesWithNewline[i]
    const newline = linesWithNewline[i + 1] || ''
    lines.push(line + newline)
  }

  let prevSlot: string | null = null

  let offset = 0
  lines.forEach((line) => {
    const start = offset
    offset += line.length
    if (codeBlocks.isInsideCodeblocks(offset) || commentBlocks.isInsideCommentBlocks(offset))
      return

    const match = line.match(/^::\s*([\w.\-:]+)\s*::(\s*)$/)
    if (match) {
      const slotName = match[1]
      // Close previous slot and open new one
      ctx.s.overwrite(
        start,
        offset - match[2].length,
        `${prevSlot ? '\n</SlotMarker>\n' : '\n'}<SlotMarker name="${slotName}">\n`,
      )
      prevSlot = slotName
    }
  })

  // Close the last slot if any
  if (prevSlot)
    ctx.s.append('\n</SlotMarker>')
}

/**
 * Transform all remaining content as default slot
 * This wraps content that isn't inside a named slot
 */
export function wrapDefaultSlotReact(
  ctx: MarkdownTransformContext,
) {
  // Check if content already has SlotMarker
  if (ctx.s.toString().includes('<SlotMarker'))
    return

  // Wrap entire content in default slot
  ctx.s.prepend('<SlotMarker name="default">\n')
  ctx.s.append('\n</SlotMarker>')
}
