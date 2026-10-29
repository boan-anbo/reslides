import MagicString from 'magic-string'
import ts from 'typescript'

const attributeNames: Record<string, string> = {
  autoplay: 'autoPlay', playsinline: 'playsInline', allowfullscreen: 'allowFullScreen',
  frameborder: 'frameBorder', readonly: 'readOnly', tabindex: 'tabIndex',
  srcset: 'srcSet', crossorigin: 'crossOrigin', referrerpolicy: 'referrerPolicy',
  colspan: 'colSpan', rowspan: 'rowSpan', maxlength: 'maxLength',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath',
}

/** Normalize authored HTML attributes and attach Vue-compatible slide scope IDs. */
export function transformSlideJsx(code: string, id: string, scopeId: string): string {
  const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const result = new MagicString(code)
  let hasClicks = false
  function visit(node: ts.Node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      && ts.isIdentifier(node.tagName) && /^[a-z]/.test(node.tagName.text)) {
      result.appendLeft(node.tagName.end, ` ${scopeId}=""`)
      const click = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute)
        && /^v-(?:click|after|click-hide)$/.test(attribute.name.getText(source)))
      if (click && ts.isJsxAttribute(click)) {
        hasClicks = true
        const name = click.name.getText(source)
        const at = name === 'v-after' ? '"+0"' : click.initializer?.getText(source) ?? '"+1"'
        const element = ts.isJsxOpeningElement(node) ? node.parent : node
        result.appendLeft(element.getStart(source), `<SlidevClickDirective at=${at}${name === 'v-click-hide' ? ' hide' : ''}>`)
        result.appendLeft(element.end, '</SlidevClickDirective>')
        result.remove(click.getStart(source), click.end)
      }
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute))
          continue
        const name = attribute.name.getText(source)
        if (attributeNames[name])
          result.overwrite(attribute.name.getStart(source), attribute.name.end, attributeNames[name])
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (hasClicks)
    result.prepend("import { VClickSingle as SlidevClickDirective } from '@slidev/client/builtin/VClick.tsx'\n")
  return result.toString()
}
