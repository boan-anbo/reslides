import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'
import { transformMonaco } from '../transform/monaco'

export function transformMonacoReact(ctx: MarkdownTransformContext) {
  transformMonaco(ctx, ({ codeLz, diffLz, lang, options, runnable }) =>
    `<Monaco codeLz="${codeLz}" lang="${lang}" ${diffLz ? `diffLz="${diffLz}" ` : ''}${runnable ? 'runnable ' : ''}optionsLz="${lz.compressToBase64(options)}" />`)
}
