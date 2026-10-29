import type { MarkdownTransformContext } from '@slidev/types'
import lz from 'lz-string'

export interface MonacoPayload {
  codeLz: string
  diffLz?: string
  lang: string
  options: string
  runnable?: boolean
}

export function transformMonaco(ctx: MarkdownTransformContext, render: (payload: MonacoPayload) => string = ({ codeLz, diffLz, lang, options, runnable }) =>
  `<Monaco ${runnable ? 'runnable ' : ''}code-lz="${codeLz}" ${diffLz ? `diff-lz="${diffLz}" ` : ''}lang="${lang}" v-bind="${options}" />`) {
  const enabled = (ctx.options.data.config.monaco === true || ctx.options.data.config.monaco === ctx.options.mode)

  if (!enabled) {
    ctx.s.replace(/\{monaco([\w:,-]*)\}/g, '')
    return
  }

  // transform monaco
  ctx.s.replace(
    /^```(\w+) *\{monaco-diff\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^~~~ *\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string, diff: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      const encodedDiff = lz.compressToBase64(diff)
      return render({ codeLz: encoded, diffLz: encodedDiff, lang, options })
    },
  )
  ctx.s.replace(
    /^```(\w+) *\{monaco\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return render({ codeLz: encoded, lang, options })
    },
  )
  ctx.s.replace(
    /^```(\w+) *\{monaco-run\} *(?:(\{[^\n]*\}) *)?\n([\s\S]+?)^```/gm,
    (full, lang = 'ts', options = '{}', code: string) => {
      lang = lang.trim()
      options = options.trim() || '{}'
      const encoded = lz.compressToBase64(code)
      return render({ codeLz: encoded, lang, options, runnable: true })
    },
  )
}
