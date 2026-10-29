import type { ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import type { PluginOption } from 'vite'
import setupVitePlugins from '../setups/vite-plugins'
import { ViteSlidevPluginReact } from '../vite-react'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'
import { createComponentsPlugin } from './components'
import { createContextInjectionPlugin } from './contextInjection'
import { createConfigPlugin } from './extendConfig'
import { createHmrPatchPlugin } from './hmrPatch'
import { createIconsPlugin } from './icons'
import { createInspectPlugin } from './inspect'
import { createLayoutWrapperPlugin } from './layoutWrapper'
import { createSlidesLoader } from './loaders'
import { createMarkdownPlugin } from './markdown'
import { createMonacoTypesLoader } from './monacoTypes'
import { createMonacoWriterPlugin } from './monacoWrite'
import { createPatchMonacoSourceMapPlugin } from './patchMonacoSourceMap'
import { createRemoteAssetsPlugin } from './remoteAssets'
import { createServerRefPlugin } from './serverRef'
import { createStaticCopyPlugin } from './staticCopy'
import { createUnocssPlugin } from './unocss'
import { createVuePlugin } from './vue'

/**
 * Main Slidev Vite plugin
 *
 * @param options - Resolved Slidev options including framework choice
 * @param pluginOptions - Plugin-specific options (Vue, markdown, etc.)
 * @param serverOptions - Server options for HMR
 */
export async function ViteSlidevPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions = {},
  serverOptions: SlidevServerOptions = {},
): Promise<PluginOption[]> {
  const framework = options.framework || 'vue'

  // Framework-specific plugins
  const frameworkPlugins = framework === 'react'
    ? await ViteSlidevPluginReact(options, serverOptions, pluginOptions)
    : [
        // Vue-specific plugins
        createSlidesLoader(options, serverOptions),
        createMarkdownPlugin(options, pluginOptions),
        createLayoutWrapperPlugin(options),
        createContextInjectionPlugin(),
        createVuePlugin(options, pluginOptions),
        createHmrPatchPlugin(),
        createVueCompilerFlagsPlugin(options),
      ]

  // Shared plugins (framework-agnostic)
  const sharedPlugins = [
    createComponentsPlugin(options, pluginOptions),
    createIconsPlugin(options, pluginOptions),
    createRemoteAssetsPlugin(options, pluginOptions),
    createServerRefPlugin(options, pluginOptions),
    createConfigPlugin(options),
    createMonacoTypesLoader(options),
    createMonacoWriterPlugin(options),
    createUnocssPlugin(options, pluginOptions),
    createStaticCopyPlugin(options, pluginOptions),
    createInspectPlugin(options, pluginOptions),
    createPatchMonacoSourceMapPlugin(),
    setupVitePlugins(options),
  ]

  return Promise.all([
    ...frameworkPlugins,
    ...sharedPlugins,
  ])
}
