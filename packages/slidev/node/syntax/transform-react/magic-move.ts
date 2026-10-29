import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'
import { transformMagicMove } from '../transform/magic-move'

export function transformMagicMoveReact(ctx: MarkdownTransformContext) {
  return transformMagicMove(ctx, ({ options, title, stepsLz, stepRanges }) =>
    `<ShikiMagicMove stepsLz="${stepsLz}" optionsLz="${lz.compressToBase64(options)}" titleLz="${lz.compressToBase64(title)}" stepRangesLz="${lz.compressToBase64(JSON.stringify(stepRanges))}" />`)
}
