import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { bold, gray, red, yellow } from 'ansis'
import { toAtFS } from '../resolver'
import { transformPublicAssetUrls } from './assetUrls'
import { transformSlideJsx } from './jsx'
import { builtinComponentsReact, regexSlideSourceIdReact, templateImportContextUtilsReact, templateInitContextReact, templateInjectionMarkerReact } from './common'

/**
 * React layout wrapper plugin
 * Parallel to packages/slidev/node/vite/layoutWrapper.ts
 *
 * Wraps React slide content with:
 * 1. Layout component import
 * 2. SlideContext provider
 * 3. Slot extraction for named slots
 *
 * Input (after markdown-to-JSX transform):
 * ```jsx
 * export default function Slide() {
 *   return (
 *     <SlotMarker name="header">Header</SlotMarker>
 *     <SlotMarker name="default">Content</SlotMarker>
 *   )
 * }
 * ```
 *
 * Output:
 * ```jsx
 * import Layout from '.../layouts-react/cover.tsx'
 * import { useSlideContext } from '@slidev/client/context'
 * import { SlotMarker, extractSlots } from '@slidev/client/slots'
 *
 * export default function Slide() {
 *   const { nav, clicksContext, frontmatter } = useSlideContext()
 *
 *   const content = (
 *     <SlotMarker name="header">Header</SlotMarker>
 *     <SlotMarker name="default">Content</SlotMarker>
 *   )
 *
 *   const slots = extractSlots(content)
 *
 *   return (
 *     <Layout {...frontmatterToProps(frontmatter)} slots={slots}>
 *       {slots.default}
 *     </Layout>
 *   )
 * }
 * ```
 */
function layoutErrorModule(message: string) {
  return `
export default function SlideLayoutError() {
  return (
    <div style={{ padding: '2rem', color: '#dc2626', fontFamily: 'monospace' }}>
      <strong>Slide layout error:</strong> ${message.replace(/[`$\\]/g, '')}
    </div>
  )
}
`
}

export function createLayoutWrapperPluginReact(
  { data, utils }: ResolvedSlidevOptions,
): Plugin {
  let publicDir: string | false = false
  return {
    name: 'slidev:layout-wrapper-react',
    enforce: 'pre',
    configResolved(config) {
      publicDir = config.publicDir
    },
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
        const layouts = await utils.getLayouts()

        // Get layout name from frontmatter
        const rawLayoutName = data.slides[index]?.frontmatter?.layout ?? data.slides[0]?.frontmatter?.defaults?.layout
        let layoutName = rawLayoutName || (index === 0 ? 'cover' : 'default')

        // Validate layout exists
        if (!layouts[layoutName]) {
          console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
            + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
          console.error()
          layoutName = 'default'
        }

        const layoutPath = layouts[layoutName]
        if (!layoutPath) {
          console.error(red(`\nUnable to resolve layout "${bold(layoutName)}".`))
          console.error()
          // Emit an explicit error component. Returning the untouched code
          // here would produce a module without a default export and a
          // misleading "does not provide an export named 'default'" error
          // in the client.
          return { code: layoutErrorModule(`Unable to resolve layout "${layoutName}" for slide ${no}`), map: { mappings: '' } }
        }

        // React framework requires React layouts (layouts-react/*).
        // utils.getLayouts() should prefer layouts-react when available.
        if (layoutPath.endsWith('.vue')) {
          console.error(red(`\nLayout "${bold(layoutName)}" is a Vue SFC (${yellow(layoutPath)}), but framework=react requires layouts-react/*.tsx.`))
          console.error()
          return { code: layoutErrorModule(`Layout "${layoutName}" resolved to a Vue SFC; framework=react needs a tsx/jsx layout`), map: { mappings: '' } }
        }

        // Check if this is already transformed JSX/MDX
        // For now, assume the content is raw markdown that needs wrapping
        // The actual MDX transform happens in a separate plugin

        // Generate React component wrapper
        const imports = [
          `import InjectedLayout from "${toAtFS(layoutPath)}"`,
          templateImportContextUtilsReact,
          `import { SlotMarker, extractSlots, frontmatterToProps } from '@slidev/client/layoutHelper.tsx'`,
        ]

        // Built-in components referenced by the markdown transform output
        // (the Vue pipeline resolves these via unplugin-vue-components;
        // React needs explicit imports).
        for (const name of builtinComponentsReact) {
          if (new RegExp(`<${name}[\\s/>]`).test(code))
            imports.push(`import ${name} from '@slidev/client/builtin/${name}.tsx'`)
        }

        const slideContent = code.trim()

        // Generate the wrapped component
        const wrappedCode = `
${imports.join('\n')}

${templateInjectionMarkerReact}

export default function SlideWrapper({ children }) {
  ${templateInitContextReact}

  // Original slide content wrapped for slot extraction
  const rawContent = (
    <>
      ${slideContent}
    </>
  )

  // Extract named slots from content
  // NOTE: Must pass rawContent.props.children, NOT rawContent itself.
  // React's Children.forEach does NOT unwrap Fragment elements - it treats
  // the Fragment as 1 child. Passing children directly fixes slot extraction.
  const slots = extractSlots(rawContent.props.children)

  return (
    <InjectedLayout {...frontmatterToProps(frontmatter, ${index})} slots={slots}>
      {slots.default || children}
    </InjectedLayout>
  )
}
`
        return {
          code: transformPublicAssetUrls(transformSlideJsx(wrappedCode, id, `data-v-slidev-${no}`), id, publicDir),
          map: { mappings: '' },
        }
      },
    },
  }
}
