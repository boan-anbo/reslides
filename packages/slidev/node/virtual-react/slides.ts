import type { VirtualModuleTemplateReact } from './types'

export const VIRTUAL_SLIDE_PREFIX_REACT = '/@slidev/slides-react/'

/**
 * React virtual module for slides collection
 * Parallel to packages/slidev/node/virtual/slides.ts
 *
 * Generates:
 * - Lazy React components using React.lazy() and dynamic import()
 * - Slide metadata with frontmatter
 * - HMR support via useSyncExternalStore pattern
 */
export const templateSlidesReact: VirtualModuleTemplateReact = {
  id: '/@slidev/slides-react',
  async getContent({ data }) {
    const statements = [
      `import { lazy, createElement } from 'react'`,
      // Use @slidev/client which gets aliased to client-react in React mode
      // Need explicit .tsx extension for virtual module imports
      `import SlideError from '@slidev/client/components/SlideError.tsx'`,
      '',
      `const componentsCache = new Array(${data.slides.length})`,
      `const loadingCache = new Array(${data.slides.length})`,
      '',
      `// Preloading and rendering share both the module and its pending promise.`,
      `function createSlideLoader(idx, importer) {`,
      `  return () => loadingCache[idx] ??= importer().catch(e => {`,
      `      console.error('Failed to load slide ' + (idx + 1), e)`,
      `      return { default: () => createElement(SlideError, { error: e, slideNo: idx + 1 }) }`,
      `    }).then(mod => componentsCache[idx] = mod)`,
      `}`,
      ``,
      `function createLazySlide(idx, loader) {`,
      `  const AsyncSlide = lazy(loader)`,
      `  return function Slide(props) {`,
      `    // React.lazy suspends on its first render even after a preload.`,
      `    return createElement(componentsCache[idx]?.default ?? AsyncSlide, props)`,
      `  }`,
      `}`,
    ]

    const slides = data.slides
      .map((_, idx) => {
        const no = idx + 1
        statements.push(
          ``,
          `// Slide ${no}`,
          `import { meta as f${no} } from '${VIRTUAL_SLIDE_PREFIX_REACT}${no}/frontmatter'`,
          `const load${no} = createSlideLoader(${idx}, () => import('${VIRTUAL_SLIDE_PREFIX_REACT}${no}/md'))`,
          `const Slide${no} = createLazySlide(${idx}, load${no})`,
        )
        return `{
  no: ${no},
  meta: f${no},
  load: load${no},
  component: Slide${no},
}`
      })

    return [
      ...statements,
      ``,
      `// Slides collection`,
      `let slidesData = [\n${slides.join(',\n')}\n]`,
      ``,
      `// HMR support using external store pattern`,
      `let listeners = new Set()`,
      ``,
      `export function subscribeSlides(callback) {`,
      `  listeners.add(callback)`,
      `  return () => listeners.delete(callback)`,
      `}`,
      ``,
      `export function getSlidesSnapshot() {`,
      `  return slidesData`,
      `}`,
      ``,
      `// Default export for compatibility`,
      `export default slidesData`,
      ``,
      `// HMR`,
      `if (import.meta.hot) {`,
      `  import.meta.hot.accept((newMod) => {`,
      `    if (newMod) {`,
      `      slidesData = newMod.default`,
      `    }`,
      `    listeners.forEach(l => l())`,
      `  })`,
      `  import.meta.hot.dispose(() => {`,
      `    componentsCache.length = 0`,
      `    loadingCache.length = 0`,
      `  })`,
      `}`,
    ].join('\n')
  },
}
