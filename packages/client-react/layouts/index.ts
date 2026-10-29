import type { ComponentType } from 'react'
import type { LayoutProps } from '../layoutHelper'

// Layout components
import { CenterLayout } from './center'
import { CoverLayout } from './cover'
import { DefaultLayout } from './default'
import { FullLayout } from './full'
import { SectionLayout } from './section'
import { TwoColsLayout } from './two-cols'

// Export all layouts
export { CenterLayout } from './center'
export { CoverLayout } from './cover'
export { DefaultLayout } from './default'
export { FullLayout } from './full'
export { SectionLayout } from './section'
export { TwoColsLayout } from './two-cols'

// Built-in layouts registry
export const builtinLayouts: Record<string, ComponentType<LayoutProps>> = {
  'default': DefaultLayout,
  'cover': CoverLayout,
  'center': CenterLayout,
  'full': FullLayout,
  'section': SectionLayout,
  'two-cols': TwoColsLayout,
}

// Re-export for convenience
export type { LayoutProps } from '../layoutHelper'
