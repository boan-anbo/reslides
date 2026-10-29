import type { VirtualModuleTemplateReact } from './types'
import { isString } from '@antfu/utils'
import { getSlideTitle, sharedMd } from '../commands/shared'

/**
 * React virtual module for configs
 * Identical to Vue version - configs are framework-agnostic JSON
 * Parallel to packages/slidev/node/virtual/configs.ts
 */
export const templateConfigsReact: VirtualModuleTemplateReact = {
  id: '/@slidev/configs-react',
  getContent({ data, remote }) {
    const config = {
      ...data.config,
      remote,
      slidesTitle: getSlideTitle(data),
    }

    if (isString(config.info))
      config.info = sharedMd.render(config.info)

    return `export default ${JSON.stringify(config)}`
  },
}
