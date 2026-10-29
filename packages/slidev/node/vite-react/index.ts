/**
 * React Vite plugins for Slidev
 * Parallel to packages/slidev/node/vite/index.ts
 *
 * Provides the plugin chain needed to build React-based Slidev presentations.
 * This is used alongside (not instead of) the Vue plugin chain when
 * framework: 'react' is specified.
 */

import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createLayoutWrapperPluginReact } from './layoutWrapper'
import { createSlidesLoaderReact } from './loaders'
import { createMarkdownPluginReact } from './markdown'

export * from './common'
export { createSlidesLoaderReact } from './loaders'
export { createLayoutWrapperPluginReact } from './layoutWrapper'
export { createMarkdownPluginReact } from './markdown'

/**
 * Create the full React Vite plugin chain
 *
 * Note: This should be called in addition to common plugins like
 * UnoCSS, icons, etc. that are framework-agnostic.
 */
export async function ViteSlidevPluginReact(
  options: ResolvedSlidevOptions,
  serverOptions: SlidevServerOptions,
  pluginOptions: SlidevPluginOptions = {},
): Promise<Plugin[]> {
  return [
    // Slide loader (provides virtual modules for slides) - must run FIRST
    // to provide raw markdown content before transformation
    createSlidesLoaderReact(options, serverOptions),
    // Markdown → JSX transformation (converts markdown to valid JSX)
    await createMarkdownPluginReact(options, pluginOptions),
    // Layout wrapper (wraps JSX content with layout components)
    createLayoutWrapperPluginReact(options),
    // React JSX transformation - runs LAST after our loaders have
    // transformed raw markdown into valid JSX. No exclude needed since
    // all our enforce:'pre' plugins run first within the same phase.
    react() as Plugin,
  ]
}
