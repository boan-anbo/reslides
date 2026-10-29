import type { SlideRoute, TocItem } from '@slidev/types'
import type { SlidevRouteMeta } from '../shim'
import { useMemo } from 'react'

// Helper type for typed meta access
type TypedSlideRoute = SlideRoute & { meta: SlidevRouteMeta }

/**
 * Build table of contents tree from slides
 * React equivalent of Vue's useTocTree
 */
export function useTocTree(
  slides: SlideRoute[],
  currentSlideNo: number,
  _currentSlideRoute: SlideRoute,
): TocItem[] {
  return useMemo(() => {
    const tree: TocItem[] = []
    const stack: TocItem[] = []

    for (const slide of slides) {
      const typedSlide = slide as TypedSlideRoute
      const frontmatter = typedSlide.meta?.slide?.frontmatter || {}

      // Skip hidden slides
      if (frontmatter.hideInToc || frontmatter.hide) {
        continue
      }

      const level = frontmatter.level ?? typedSlide.meta?.slide?.level ?? 1
      const title = frontmatter.title ?? typedSlide.meta?.slide?.title ?? `Slide ${slide.no}`

      const item: TocItem = {
        no: slide.no,
        level,
        titleLevel: level,
        title,
        path: `/${slide.no}`,
        active: slide.no === currentSlideNo,
        activeParent: false,
        hasActiveParent: false,
        children: [],
      }

      // Find parent in stack
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      if (stack.length === 0) {
        tree.push(item)
      } else {
        const parent = stack[stack.length - 1]
        parent.children.push(item)
        item.hasActiveParent = parent.active || parent.hasActiveParent
      }

      stack.push(item)
    }

    // Mark active parents
    function markActiveParents(items: TocItem[]): boolean {
      let hasActive = false
      for (const item of items) {
        const childHasActive = markActiveParents(item.children)
        if (item.active || childHasActive) {
          hasActive = true
          item.activeParent = childHasActive
        }
      }
      return hasActive
    }

    markActiveParents(tree)

    return tree
  }, [slides, currentSlideNo])
}
