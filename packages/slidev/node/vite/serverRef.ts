import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import ServerRef from 'vite-plugin-vue-server-ref'
import { loadDrawings, writeDrawings } from '../integrations/drawings'
import { loadSnapshots, writeSnapshots } from '../integrations/snapshots'

export async function createServerRefPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  const state = {
    sync: false,
    nav: {
      page: 0,
      clicks: 0,
      timer: {
        status: 'stopped',
        slides: {},
        startedAt: 0,
        pausedAt: 0,
      },
    },
    drawings: await loadDrawings(options),
    snapshots: await loadSnapshots(options),
    ...pluginOptions.serverRef?.state,
  }
  const plugin = ServerRef({
    debug: false,
    state,
    onChanged(key, data, patch, timestamp) {
      pluginOptions.serverRef?.onChanged?.(key, data, patch, timestamp)

      if (options.data.config.drawings.persist && key === 'drawings')
        writeDrawings(options, patch ?? data)

      if (key === 'snapshots')
        writeSnapshots(options, data)
    },
  })
  if (options.framework === 'react' && typeof plugin.load === 'function') {
    const load = plugin.load
    plugin.load = async function (id, ...args) {
      // Keep the canonical plugin's module registration/invalidation and POST
      // handler. Only replace its Vue-specific client module serializer.
      const result = await load.call(this, id, ...args)
      const match = id.match(/^\/@server-reactive\/([^?]+)/)
      if (!result || !match) return result
      const key = match[1].replaceAll('/', '.')
      const initial = key.split('.').reduce<unknown>((value, name) =>
        value && typeof value === 'object' ? Reflect.get(value, name) : undefined, state)
      return `import { createServerState } from '@slidev/client/state/serverState.ts'\nexport default createServerState(${JSON.stringify(key)}, ${JSON.stringify(initial ?? {})})`
    }
  }
  return plugin
}
