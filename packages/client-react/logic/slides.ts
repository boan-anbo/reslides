import type { SlideRoute } from '@slidev/types'
import type { SlidevRouteMeta } from '../shim'
import { slides } from '../env'

export { slides }

// Helper type for typed meta access
type TypedSlideRoute = SlideRoute & { meta: SlidevRouteMeta }

/**
 * Get slide by number or route alias
 */
export function getSlide(no: number | string): typeof slides[number] | undefined {
  return slides.find(s => s.no === +no || s.meta.slide.frontmatter.routeAlias === no)
}

/**
 * Get the path for a slide
 */
export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
  exporting: boolean = false,
): string {
  if (typeof route === 'number' || typeof route === 'string') {
    route = getSlide(route)!
  }

  const typedRoute = route as TypedSlideRoute
  const no = typedRoute?.meta?.slide?.frontmatter?.routeAlias ?? route?.no ?? 1

  if (exporting) return `/export/${no}`
  if (presenter) return `/presenter/${no}`
  return `/${no}`
}
