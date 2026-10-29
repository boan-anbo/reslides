/**
 * Toc component for React
 * Port of Vue client builtin/Toc.vue
 *
 * Table Of Content
 * `mode` can be either 'all', 'onlyCurrentTree' or 'onlySiblings'
 *
 * Usage:
 * <Toc columns={2} maxDepth={3} mode="onlySiblings" />
 */

import type { TocItem } from '@slidev/types'
import { useMemo } from 'react'
import { useSlideContext } from '../context'
import { TocList } from './TocList'

export interface TocProps {
  columns?: string | number
  listClass?: string | string[]
  start?: string | number
  listStyle?: string | string[]
  maxDepth?: string | number
  minDepth?: string | number
  mode?: 'all' | 'onlyCurrentTree' | 'onlySiblings'
}

export function Toc({
  columns = 1,
  listClass = '',
  start = 1,
  listStyle = '',
  maxDepth = Number.POSITIVE_INFINITY,
  minDepth = 1,
  mode = 'all',
}: TocProps) {
  const { $slidev } = useSlideContext()

  const toc = useMemo(() => {
    const tree = $slidev?.nav.tocTree
    if (!tree)
      return []

    function filterTreeDepth(items: TocItem[], level = 1): TocItem[] {
      if (level > Number(maxDepth)) {
        return []
      }
      else if (level < Number(minDepth)) {
        const activeItem = items.find((item: TocItem) => item.active || item.activeParent)
        return activeItem ? filterTreeDepth(activeItem.children, level + 1) : []
      }
      return items.map((item: TocItem) => ({
        ...item,
        children: filterTreeDepth(item.children, level + 1),
      }))
    }

    function filterOnlyCurrentTree(items: TocItem[]): TocItem[] {
      return items
        .filter((item: TocItem) => item.active || item.activeParent || item.hasActiveParent)
        .map((item: TocItem) => ({
          ...item,
          children: filterOnlyCurrentTree(item.children),
        }))
    }

    function filterOnlySiblings(items: TocItem[]): TocItem[] {
      const treehasActiveItem = items.some(
        (item: TocItem) => item.active || item.activeParent || item.hasActiveParent,
      )
      return items
        .filter(() => treehasActiveItem)
        .map((item: TocItem) => ({
          ...item,
          children: filterOnlySiblings(item.children),
        }))
    }

    let tocTree = filterTreeDepth(tree)
    if (mode === 'onlyCurrentTree')
      tocTree = filterOnlyCurrentTree(tocTree)
    else if (mode === 'onlySiblings')
      tocTree = filterOnlySiblings(tocTree)

    return tocTree
  }, [$slidev?.nav.tocTree, maxDepth, minDepth, mode])

  return (
    <div className="slidev-toc" style={{ columnCount: Number(columns) }}>
      <TocList
        level={1}
        start={start}
        listStyle={listStyle}
        list={toc}
        listClass={listClass}
      />
    </div>
  )
}

export default Toc
