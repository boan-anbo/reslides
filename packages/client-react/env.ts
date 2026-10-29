import type { SlidevClientConfig } from '@slidev/types'
import { objectMap } from '@antfu/utils'

// ============================================================================
// Virtual Module Imports
// These will be provided by the Vite plugin at build time
// ============================================================================

// Virtual modules - declared in shim.d.ts
import slidesData from '#slidev/slides'
import configsData from '#slidev/configs'

export const slides = slidesData
export const configs: SlidevClientConfig = configsData

// Derive themeVars from configs.themeConfig
// Converts { primary: '#fff' } to { '--slidev-theme-primary': '#fff' }
export function getThemeVars(): Record<string, string | number> {
  return objectMap(configs.themeConfig || {}, (k, v) => [`--slidev-theme-${k}`, v])
}

// ============================================================================
// Development Mode Utilities
// ============================================================================

declare global {
  const __DEV__: boolean
  const __SLIDEV_CLIENT_ROOT__: string
  const __SLIDEV_HASH_ROUTE__: boolean
  const __SLIDEV_FEATURE_PRESENTER__: boolean
  const __SLIDEV_FEATURE_PRINT__: boolean
  const __SLIDEV_FEATURE_BROWSER_EXPORTER__: boolean
  const __SLIDEV_FEATURE_DRAWINGS__: boolean
  const __SLIDEV_FEATURE_DRAWINGS_PERSIST__: boolean
  const __SLIDEV_FEATURE_WAKE_LOCK__: boolean
  const __SLIDEV_FEATURE_EDITOR__: boolean
}

export const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false
export const clientRoot = typeof __SLIDEV_CLIENT_ROOT__ !== 'undefined' ? __SLIDEV_CLIENT_ROOT__ : ''
export const hashRoute = typeof __SLIDEV_HASH_ROUTE__ !== 'undefined' ? __SLIDEV_HASH_ROUTE__ : false

// ============================================================================
// Slide Dimensions (matches Vue env.ts)
// ============================================================================

export const mode = isDev ? 'dev' : 'build'

export const slideAspect = configs.aspectRatio
export const slideWidth = configs.canvasWidth

// To honor the aspect ratio as much as possible, approximate height to next integer
// This prevents creating additional empty white pages after each page on print
export const slideHeight = Math.ceil(slideWidth / slideAspect)

export const slidesTitle = configs.slidesTitle || configs.title

export const pathPrefix = (typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.BASE_URL || '/'
  : '/') + (hashRoute ? '#/' : '')
