/**
 * Type shims for @slidev/client-react
 * Parallel to packages/client/shim-vue.d.ts
 */

/**
 * Slide metadata within route meta
 * Matches the vue-router RouteMeta.slide augmentation in shim-vue.d.ts
 */
export interface SlideMetaInfo extends Omit<import('@slidev/types').SlideInfo, 'source'> {
  noteHTML: string
  filepath: string
  start: number
  id: number
  no: number
  total: number
}

/**
 * Route metadata for React Router
 * Matches the vue-router RouteMeta augmentation in shim-vue.d.ts
 */
export interface SlidevRouteMeta {
  // inherited from frontmatter
  layout?: string
  name?: string
  class?: string
  clicks?: number
  transition?: string | import('./hooks/useTransition').TransitionGroupProps | undefined
  preload?: boolean

  // slide info
  slide: SlideMetaInfo

  // private fields
  __clicksContext: import('@slidev/types').ClicksContext | null
  __preloaded?: boolean
}

// Re-export types for convenience
export type { ClicksContext, SlideInfo } from '@slidev/types'
export type { TransitionGroupProps } from './hooks/useTransition'
