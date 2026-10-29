import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin, UserConfig } from 'vite'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { slash, uniq } from '@antfu/utils'
import { createResolve } from 'mlly'
import { mergeConfig } from 'vite'
import { isInstalledGlobally, resolveImportPath, toAtFS } from '../resolver'

const INCLUDE_GLOBAL = [
  '@typescript/ata',
  'file-saver',
  'lz-string',
  'recordrtc',
  'typescript',
  'yaml',
  'pptxgenjs',
  'ansis',
]

const INCLUDE_LOCAL = INCLUDE_GLOBAL.map(i => `@slidev/cli > @slidev/client > ${i}`)

// @keep-sorted
const EXCLUDE_GLOBAL = [
  '@antfu/utils',
  '@shikijs/monaco',
  '@shikijs/vitepress-twoslash/client',
  '@slidev/client',
  '@slidev/client/constants',
  '@slidev/client/context',
  '@slidev/client/logic/dark',
  '@slidev/parser',
  '@slidev/parser/core',
  '@slidev/rough-notation',
  '@slidev/types',
  '@unhead/vue',
  '@unocss/reset',
  '@vueuse/core',
  '@vueuse/math',
  '@vueuse/motion',
  '@vueuse/shared',
  'drauu',
  'floating-vue',
  'fuse.js',
  'mermaid',
  'monaco-editor',
  'shiki-magic-move/vue',
  'shiki',
  'shiki/core',
  'vue-demi',
  'vue-router',
  'vue',
]

const INCLUDE_REACT_COMPONENTS = ['@floating-ui/react', 'react-router-dom', 'framer-motion', 'shiki-magic-move/react', 'shiki-magic-move/core']
const INCLUDE_REACT_RUNTIME = ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime', 'react/jsx-runtime']

const EXCLUDE_LOCAL = EXCLUDE_GLOBAL

const ASYNC_MODULES = [
  'file-saver',
  'vue',
  '@vue',
]

export function createConfigPlugin(options: ResolvedSlidevOptions): Plugin {
  const reactClientRoot = options.reactClientRoot || slash(options.clientRoot).replace(/\/client$/, '/client-react')
  const toDirUrl = (dir: string) => {
    // Ensure a directory URL (trailing separator) for correct Node resolution.
    // If it's treated as a file URL, Node may walk up and resolve deps from the wrong node_modules.
    const resolved = resolve(dir)
    const normalized = resolved.endsWith(sep) ? resolved : `${resolved}${sep}`
    return pathToFileURL(normalized)
  }
  const resolveClientDepRaw = createResolve({
    // Same as Vite's default resolve conditions
    conditions: ['import', 'module', 'browser', 'default', options.mode === 'build' ? 'production' : 'development'],
    // NOTE: createResolve url must be a directory URL (trailing slash) so it can
    // correctly resolve packages from `<dir>/node_modules` instead of walking up.
    url: toDirUrl(options.clientRoot),
  })
  const resolveReactClientDepRaw = createResolve({
    conditions: ['import', 'module', 'browser', 'default', options.mode === 'build' ? 'production' : 'development'],
    url: toDirUrl(reactClientRoot),
  })
  const resolveCliDepRaw = createResolve({
    conditions: ['import', 'module', 'browser', 'default', options.mode === 'build' ? 'production' : 'development'],
    url: toDirUrl(options.cliRoot),
  })
  const resolveUserDepRaw = createResolve({
    // Same as Vite's default resolve conditions
    conditions: ['import', 'module', 'browser', 'default', options.mode === 'build' ? 'production' : 'development'],
    // NOTE: createResolve url must be a directory URL (trailing slash) so it can
    // correctly resolve packages from `<dir>/node_modules` instead of walking up.
    url: toDirUrl(options.userRoot),
  })
  const resolveClientDep = async (dep: string) => {
    for (const fn of [resolveReactClientDepRaw, resolveClientDepRaw, resolveCliDepRaw, resolveUserDepRaw]) {
      try {
        return await fn(dep)
      }
      catch {}
    }
    return await resolveClientDepRaw(dep)
  }
  const resolveUserDep = async (dep: string) => {
    for (const fn of [resolveUserDepRaw, resolveReactClientDepRaw, resolveClientDepRaw, resolveCliDepRaw]) {
      try {
        return await fn(dep)
      }
      catch {}
    }
    return await resolveUserDepRaw(dep)
  }
  return {
    name: 'slidev:config',
    async config(config) {
      const dedupe = uniq([
        'vue',
        ...(options.framework === 'react'
          ? [
              'react',
              'react-dom',
              'react-dom/client',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
            ]
          : []),
      ])
      const injection: UserConfig = {
        define: options.utils.define,
        resolve: {
          alias: [
            // Route @slidev/client imports to React client when framework=react
            // But keep styles from Vue client (they're framework-agnostic CSS)
            ...(options.framework === 'react'
              ? [
                  // Pin React resolution to the user's root to avoid multiple React copies.
                  {
                    find: /^react$/,
                    replacement: fileURLToPath(await resolveUserDep('react')),
                  },
                  {
                    find: /^react-dom\/client$/,
                    replacement: fileURLToPath(await resolveUserDep('react-dom/client')),
                  },
                  {
                    find: /^react-dom$/,
                    replacement: fileURLToPath(await resolveUserDep('react-dom')),
                  },
                  {
                    find: /^react\/jsx-runtime$/,
                    replacement: fileURLToPath(await resolveUserDep('react/jsx-runtime')),
                  },
                  {
                    find: /^react\/jsx-dev-runtime$/,
                    replacement: fileURLToPath(await resolveUserDep('react/jsx-dev-runtime')),
                  },
                  {
                    find: /^@slidev\/client$/,
                    replacement: `${toAtFS(reactClientRoot)}/index.ts`,
                  },
                  {
                    // Keep styles from Vue client - they're pure CSS
                    find: /^@slidev\/client\/styles\/(.*)/,
                    replacement: `${toAtFS(options.clientRoot)}/styles/$1`,
                  },
                  {
                    find: /^@slidev\/client\/(.*)/,
                    replacement: `${toAtFS(reactClientRoot)}/$1`,
                  },
                ]
              : [
                  {
                    find: /^@slidev\/client$/,
                    replacement: `${toAtFS(options.clientRoot)}/index.ts`,
                  },
                  {
                    find: /^@slidev\/client\/(.*)/,
                    replacement: `${toAtFS(options.clientRoot)}/$1`,
                  },
                ]),
            {
              find: /^#slidev\/(.*)/,
              // Route to React virtual modules when framework=react
              replacement: options.framework === 'react' ? '/@slidev/$1-react' : '/@slidev/$1',
            },
            // Vue is still needed for shared utilities even in React mode
            {
              find: 'vue',
              replacement: await resolveImportPath('vue/dist/vue.esm-bundler.js', true),
            },
            ...((isInstalledGlobally.value || options.framework === 'react')
              ? await Promise.all([...INCLUDE_GLOBAL, ...(options.framework === 'react' ? INCLUDE_REACT_COMPONENTS : [])].map(async dep => ({
                  find: new RegExp(`^${dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
                  replacement: fileURLToPath(await resolveClientDep(dep)),
                })))
              : []
            ),
          ],
          dedupe,
        },
        // React's virtual entry is also used from decks outside the CLI's package
        // tree. Resolve its runtime dependencies before the first navigation,
        // rather than discovering a second React bundle in a lazy slide.
        optimizeDeps: (isInstalledGlobally.value || options.framework === 'react')
          ? {
              exclude: EXCLUDE_GLOBAL,
              include: [
                ...INCLUDE_GLOBAL,
                // Add React deps when framework=react
                ...(options.framework === 'react'
                  ? [...INCLUDE_REACT_RUNTIME, ...INCLUDE_REACT_COMPONENTS]
                  : []),
              ],
            }
          : {
              // We need to specify the full deps path for non-hoisted modules
              exclude: EXCLUDE_LOCAL,
              include: INCLUDE_LOCAL,
            },
        css: {
          postcss: {
            plugins: [
              await import('postcss-nested').then(r => (r.default || r)()) as any,
            ],
          },
        },
        server: {
          fs: {
            strict: true,
            allow: uniq([
              options.userWorkspaceRoot,
              options.clientRoot,
              // For React framework, also allow client-react directory
              ...(options.framework === 'react'
                ? [reactClientRoot]
                : []),
              // Special case for PNPM global installation
              isInstalledGlobally.value
                ? slash(options.cliRoot).replace(/\/\.pnpm\/.*$/gi, '')
                : options.cliRoot,
              ...options.roots,
            ]),
          },
        },
        publicDir: join(options.userRoot, 'public'),
        build: {
          rollupOptions: {
            output: {
              chunkFileNames(chunkInfo) {
                const DEFAULT = 'assets/[name]-[hash].js'

                // Already handled in manualChunks
                if (chunkInfo.name.includes('/'))
                  return DEFAULT

                // Over 60% of the chunk is slidev client code, we put it into slidev chunk
                if (chunkInfo.moduleIds.filter(i => isSlidevClient(i)).length > chunkInfo.moduleIds.length * 0.6)
                  return 'assets/slidev/[name]-[hash].js'

                // Monaco Editor
                if (chunkInfo.moduleIds.filter(i => i.match(/\/monaco-editor(-core)?\//)).length > chunkInfo.moduleIds.length * 0.6)
                  return 'assets/monaco/[name]-[hash].js'

                return DEFAULT
              },
              manualChunks(id) {
                if (id.startsWith('/@slidev-monaco-types/') || id.includes('/@slidev/monaco-types') || id.endsWith('?monaco-types&raw'))
                  return 'monaco/bundled-types'
                if (id.includes('/shiki/') || id.includes('/@shikijs/'))
                  return `modules/shiki`
                if (id.startsWith('~icons/'))
                  return 'modules/unplugin-icons'
                // It seems that moving slides out will breaks the production build
                // Would need to find a better way to handle this
                // const slideMatch = id.match(/\/@slidev\/slides\/(\d+)/)
                // if (slideMatch && !id.includes('.frontmatter'))
                //   return `slides/${slideMatch[1]}`

                const matchedAsyncModule = ASYNC_MODULES.find(i => id.includes(`/node_modules/${i}`))
                if (matchedAsyncModule)
                  return `modules/${matchedAsyncModule.replace('@', '').replace('/', '-')}`
              },
            },
          },
        },
        cacheDir: isInstalledGlobally.value ? join(options.cliRoot, 'node_modules/.vite') : undefined,
      }

      function isSlidevClient(id: string) {
        return id.includes('/@slidev/') || id.includes('/slidev/packages/client/') || id.includes('/@vueuse/')
      }

      // function getNodeModuleName(path: string) {
      //   const nodeModuelsMatch = [...path.matchAll(/node_modules\/(@[^/]+\/[^/]+|[^/]+)\//g)]
      //   if (nodeModuelsMatch.length)
      //     return nodeModuelsMatch[nodeModuelsMatch.length - 1][1]
      // }

      return mergeConfig(injection, config)
    },
    configureServer(server) {
      // serve our index.html after vite history fallback
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/index.html') {
            const headers = server.config.server.headers ?? {}

            for (const header in headers) {
              res.setHeader(header, headers[header]!)
            }

            res.setHeader('Content-Type', 'text/html')
            res.statusCode = 200

            // Use Vite's transformIndexHtml to properly inject React refresh preamble
            // and other Vite plugins. This replaces the manual preamble injection
            // that was previously in setupIndexHtml.
            const html = await server.transformIndexHtml(req.url ?? '/', options.utils.indexHtml)
            res.end(html)
            return
          }
          next()
        })
      }
    },
  }
}
