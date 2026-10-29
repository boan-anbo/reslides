/**
 * Slidev context types for React
 * Port of Vue client modules/context.ts
 */

import type { SlidevContextNav } from '../hooks/useNav'
import type { configs } from '../env'

export interface SlidevContext {
  nav: SlidevContextNav
  configs: typeof configs
  themeConfigs: typeof configs['themeConfig']
}
