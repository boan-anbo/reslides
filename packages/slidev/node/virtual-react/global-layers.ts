/**
 * React global-layers virtual module
 * Port of packages/slidev/node/virtual/global-layers.ts
 *
 * Provides GlobalTop, GlobalBottom, SlideTop, SlideBottom components
 * that aggregate theme/user-provided global layer components.
 */

import type { VirtualModuleTemplateReact } from './types'
import { join } from 'node:path'
import { makeAbsoluteImportGlob } from '../utils'

export const templateGlobalLayersReact: VirtualModuleTemplateReact = {
  id: `/@slidev/global-layers-react`,
  getContent({ userRoot, roots }) {
    const lines: string[] = []

    lines.push(`import React from 'react'`)
    lines.push('')

    function addComponent(name: string, names: string[]) {
      lines.push(`const ${name}Components = [`)
      for (const root of roots) {
        // React extensions only - do NOT include .vue
        const globs = names.map(n => join(root, `${n}.{tsx,ts,jsx,js}`))
        lines.push(`  Object.values(${makeAbsoluteImportGlob(userRoot, globs, { import: 'default' })})[0],`)
      }
      lines.push(`].filter(Boolean)`)
      lines.push('')

      // Create React component that renders all found components
      // NOTE: Must use React.createElement, NOT JSX syntax
      // Virtual modules don't have .tsx extension so JSX transform won't apply
      lines.push(`export function ${name}() {`)
      lines.push(`  if (${name}Components.length === 0) return null`)
      lines.push(`  return React.createElement(`)
      lines.push(`    React.Fragment,`)
      lines.push(`    null,`)
      lines.push(`    ...${name}Components.map((Comp, i) => React.createElement(Comp, { key: i }))`)
      lines.push(`  )`)
      lines.push(`}`)
      lines.push('')
    }

    addComponent('GlobalTop', ['global', 'global-top', 'GlobalTop'])
    addComponent('GlobalBottom', ['global-bottom', 'GlobalBottom'])
    addComponent('SlideTop', ['slide-top', 'SlideTop'])
    addComponent('SlideBottom', ['slide-bottom', 'SlideBottom'])

    return lines.join('\n')
  },
}
