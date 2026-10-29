/**
 * Helpers for lz-compressed component props.
 *
 * The React markdown pipeline cannot emit Vue-style structured attributes
 * (`v-bind="{...}"`, `:ranges='[...]'`) - braces inside HTML attributes
 * make markdown-it split the tag apart. Object/array payloads are instead
 * lz-compressed into plain string attributes and decoded here.
 */
import lz from 'lz-string'

/** Decode an lz-compressed JS object literal (e.g. `{scale: 0.5}`). */
export function decodeLzObject(value?: string): Record<string, unknown> {
  if (!value)
    return {}
  try {
    const literal = lz.decompressFromBase64(value) || '{}'
    // The payload originates from the deck markdown itself - the same
    // trust level as Vue's v-bind evaluation of it.
    // eslint-disable-next-line no-new-func
    return new Function(`return (${literal})`)() ?? {}
  }
  catch {
    return {}
  }
}

/** Decode an lz-compressed plain string. */
export function decodeLzString(value?: string): string {
  if (!value)
    return ''
  try {
    return lz.decompressFromBase64(value) || ''
  }
  catch {
    return ''
  }
}

/** Split a pipe-joined ranges attribute ("all|1,2" -> ['all', '1,2']). */
export function parseRangesRaw(value?: string): string[] {
  if (!value)
    return []
  return value.split('|').map(s => s.trim()).filter(Boolean)
}
