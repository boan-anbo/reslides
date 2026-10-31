import { statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { Parser } from 'htmlparser2'
import MagicString from 'magic-string'
import ts from 'typescript'

const assetAttributes = new Set(['src', 'href', 'poster', 'data', 'xlink:href'])

/** Give public asset references to Vite, which owns base and build URL resolution. */
export function transformPublicAssetUrls(code: string, id: string, publicDir: string | false): string {
  if (!publicDir)
    return code

  const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const result = new MagicString(code)
  const imports = new Map<string, string>()
  const root = resolve(publicDir)

  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && assetAttributes.has(node.name.getText(source))) {
      const value = node.initializer
      if (value && ts.isStringLiteral(value)) {
        // JSX quoted attributes use HTML entities, unlike JS import strings.
        let url = value.text
        const parser = new Parser({ onattribute: (_name, decoded) => { url = decoded } })
        parser.end(`<img src=${value.getText(source)} />`)
        // Protocol-relative URLs and application routes are not public files.
        if (url.startsWith('/') && !url.startsWith('//')) {
          let pathname: string
          try {
            pathname = decodeURIComponent(url.split(/[?#]/, 1)[0])
          }
          catch {
            return
          }
          // Do not rewrite .html/.htm documents (e.g. <iframe src="/demo/index.html">)
          // into JS ES module imports, because Vite rejects importing HTML files from public/.
          if (/\.html?$/i.test(pathname))
            return
          const file = resolve(root, `.${pathname}`)
          if (file.startsWith(root + sep) && statSync(file, { throwIfNoEntry: false })?.isFile()) {
            let name = imports.get(url)
            if (!name) {
              name = `__slidev_public_asset_${imports.size}`
              imports.set(url, name)
            }
            result.overwrite(value.getStart(source), value.end, `{${name}}`)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
  if (!imports.size)
    return code
  result.prepend([...imports].map(([url, name]) => `import ${name} from ${JSON.stringify(url)};\n`).join(''))
  return result.toString()
}
