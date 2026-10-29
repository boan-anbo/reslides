import type { ClicksContext, RenderContext, SlideRoute } from '@slidev/types'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { SlidevContextNav } from './hooks/useNav'
import {
  FRONTMATTER_FIELDS,
  HEADMATTER_FIELDS,
} from './constants'

// ============================================================================
// Context Definitions
// ============================================================================

export interface SlidevContext {
  nav: SlidevContextNav
  configs: Record<string, any>
  themeConfigs: Record<string, any>
}

export const SlidevContextContext = createContext<SlidevContext | null>(null)
export const ClicksContextContext = createContext<ClicksContext | null>(null)
export const ClicksValueContext = createContext<number>(0)
export const CurrentPageContext = createContext<number>(1)
export const SlideElementContext = createContext<HTMLElement | null>(null)
export const SlideScaleContext = createContext<number>(1)
export const RouteContext = createContext<SlideRoute | null>(null)
export const RenderContextContext = createContext<RenderContext>('slide')
export const FrontmatterContext = createContext<Record<string, any>>({})
export const SlideZoomContext = createContext<number>(1)

// ============================================================================
// Hook: useSlideContext
// ============================================================================

export interface SlideContextValue {
  $slidev: SlidevContext | null
  $nav: SlidevContextNav | null
  $clicksContext: ClicksContext | null
  $clicks: number
  $page: number
  $route: SlideRoute | null
  $renderContext: RenderContext
  $frontmatter: Record<string, any>
  $scale: number
  $zoom: number
}

/**
 * Get the current slide context
 * React equivalent of Vue's useSlideContext()
 */
export function useSlideContext(): SlideContextValue {
  const $slidev = useContext(SlidevContextContext)
  const $clicksContext = useContext(ClicksContextContext)
  const $clicksValue = useContext(ClicksValueContext)
  const $page = useContext(CurrentPageContext)
  const $route = useContext(RouteContext)
  const $renderContext = useContext(RenderContextContext)
  const $frontmatter = useContext(FrontmatterContext)
  const $scale = useContext(SlideScaleContext)
  const $zoom = useContext(SlideZoomContext)

  return {
    $slidev,
    $nav: $slidev?.nav ?? null,
    $clicksContext,
    // Use ClicksValueContext for reactive updates instead of clicksContext.current getter
    $clicks: $clicksValue,
    $page,
    $route,
    $renderContext,
    $frontmatter,
    $scale,
    $zoom,
  }
}

// ============================================================================
// Provider Components
// ============================================================================

interface SlideContextProviderProps {
  children: ReactNode
  // Full props
  page?: number
  route?: SlideRoute | null
  clicksContext?: ClicksContext | null
  clicks?: number  // Current clicks value for reactive updates
  frontmatter?: Record<string, any>
  renderContext?: RenderContext
  scale?: number
  zoom?: number
  // Simplified props (for SlideWrapper)
  slideNo?: number
}

export function SlideContextProvider({
  children,
  page,
  route,
  clicksContext,
  clicks,
  frontmatter,
  renderContext = 'slide',
  scale,
  zoom = 1,
  slideNo,
}: SlideContextProviderProps) {
  // Use slideNo if provided, otherwise use page
  const inheritedScale = useContext(SlideScaleContext)
  const pageValue = slideNo ?? page ?? 1
  const frontmatterValue = frontmatter ?? {}
  // Use clicks prop if provided, otherwise get from clicksContext
  const clicksValue = clicks ?? clicksContext?.current ?? 0

  return (
    <CurrentPageContext.Provider value={pageValue}>
      <RouteContext.Provider value={route ?? null}>
        <ClicksContextContext.Provider value={clicksContext ?? null}>
          <ClicksValueContext.Provider value={clicksValue}>
            <FrontmatterContext.Provider value={frontmatterValue}>
              <RenderContextContext.Provider value={renderContext}>
                <SlideScaleContext.Provider value={scale ?? inheritedScale}>
                  <SlideZoomContext.Provider value={zoom}>
                    {children}
                  </SlideZoomContext.Provider>
                </SlideScaleContext.Provider>
              </RenderContextContext.Provider>
            </FrontmatterContext.Provider>
          </ClicksValueContext.Provider>
        </ClicksContextContext.Provider>
      </RouteContext.Provider>
    </CurrentPageContext.Provider>
  )
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert frontmatter options to props
 * Removes known option fields and exposes full frontmatter
 */
export function frontmatterToProps(frontmatter: Record<string, any>, pageNo: number) {
  const fieldsToOmit = pageNo === 0 ? HEADMATTER_FIELDS : FRONTMATTER_FIELDS
  const props: Record<string, any> = { frontmatter }

  for (const [key, value] of Object.entries(frontmatter)) {
    if (!fieldsToOmit.includes(key)) {
      props[key] = value
    }
  }

  return props
}
