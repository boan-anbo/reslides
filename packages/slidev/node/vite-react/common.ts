/**
 * Common patterns and utilities for React Vite plugins
 * Parallel to packages/slidev/node/vite/common.ts
 */

// REST endpoint for slide info/updates. MUST be the same path the client
// fetches (hooks/useSlideInfo.ts: /__slidev/slides/N.json) - an earlier
// "-react" variant here meant the middleware never matched and presenter
// notes / note editing / drag persistence silently got the HTML fallback.
export const regexSlideReqPathReact = /^\/__slidev\/slides\/(\d+)\.json$/

// Virtual module resolution pattern for React
export const regexSlideFacadeIdReact = /^\/@slidev\/slides-react\/(\d+)\/(md|frontmatter)($|\?)/

// Source file ID pattern for React slides
// .tsx for slide content (contains JSX), .ts for frontmatter (data only)
export const regexSlideSourceIdReact = /__slidev_react_(\d+)\.(tsx|ts)$/

// Injection marker for React context
export const templateInjectionMarkerReact = '/* @slidev-react-injection */'

// Context import for React.
// IMPORTANT: use `@slidev/client/*` so Vite can alias it to the React client in React mode.
// Do NOT import from `@slidev/client-react/*` here because that package may not be installed
// as a dependency (it's a workspace package in this repo).
export const templateImportContextUtilsReact = `import { useSlideContext } from "@slidev/client/context.tsx"`

// Context initialization for React - uses $ prefixed names from useSlideContext
export const templateInitContextReact = `const { $nav: nav, $clicksContext: clicksContext, $frontmatter: frontmatter, $renderContext: renderContext, $slidev: slidev } = useSlideContext()`

/**
 * Built-in components available in packages/client-react/builtin.
 * In Vue, unplugin-vue-components resolves these (both PascalCase and
 * kebab-case tags) automatically; the React pipeline renames kebab tags to
 * PascalCase in markdown.ts and injects imports in layoutWrapper.ts.
 *
 * Components are explicitly imported into generated React slide modules.
 */
export const builtinComponentsReact = [
  'Arrow',
  'AutoFitText',
  'CodeBlockWrapper',
  'CodeGroup',
  'InPageCss',
  'KaTexBlockWrapper',
  'LightOrDark',
  'Link',
  'Mermaid',
  'PlantUml',
  'PoweredBySlidev',
  'RenderWhen',
  'ShikiMagicMove',
  'Monaco',
  'SlideCurrentNo',
  'SlidesTotal',
  'SlidevVideo',
  'Toc',
  'Transform',
  'Tweet',
  'VClick',
  'VAfter',
  'VClicks',
  'VDrag',
  'VDragArrow',
  'VSwitch',
  'Youtube',
] as const

/** PascalCase -> kebab-case (VClicks -> v-clicks, AutoFitText -> auto-fit-text) */
export function toKebabTag(name: string): string {
  // hyphenate before EVERY non-leading uppercase letter, matching Vue's
  // hyphenate() (so VClicks -> v-clicks, not vclicks)
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}
