import type { CSSProperties, ComponentType } from 'react'
import type { SlideRoute, RenderContext, ClicksContext, ClicksInfo } from '@slidev/types'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
} from '../constants'
import { SlideContextProvider } from '../context'
import { configs } from '../env'
import type { SlidevRouteMeta } from '../shim'
import { DrawingPreview } from './DrawingPreview'
// Import global layers - will be resolved by virtual module
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Virtual module
import { SlideBottom, SlideTop } from '#slidev/global-layers'
import './SlideWrapper.css'

interface SlideWrapperProps {
  route: SlideRoute
  renderContext: RenderContext
  clicksContext?: ClicksContext
  clicks?: number
}

// Helper type for typed meta access
type TypedSlideRoute = SlideRoute & { meta?: SlidevRouteMeta }

/**
 * Parse v-click attribute value
 * Returns: [atValue, hide, fade]
 */
function parseVClickAttr(value: string | null, isHide: boolean): [string | number, boolean, boolean] {
  // Default to '+1' if no value
  const at = value || '+1'

  // Parse modifiers from value (e.g., "1.fade" or just "1")
  const fade = at.includes('.fade')
  const cleanAt = at.replace('.fade', '').replace('.hide', '')

  // Parse numeric or relative value
  const numeric = Number(cleanAt)
  const atValue = cleanAt.match(/^[+-]/) ? cleanAt : Number.isFinite(numeric) ? numeric : '+1'

  return [atValue, isHide, fade]
}

/**
 * Apply v-click class toggling to an element based on clicks state
 */
function applyVClickClasses(
  el: HTMLElement,
  info: ClicksInfo,
  hide: boolean,
  fade: boolean,
): void {
  const isActive = info.isActive
  const isCurrent = info.isCurrent
  const prior = isActive && !isCurrent

  el.classList.add(CLASS_VCLICK_TARGET)

  // Set data attributes for debugging
  el.dataset.slidevClicksStart = String(info.start)
  if (Number.isFinite(info.end)) {
    el.dataset.slidevClicksEnd = String(info.end)
  }

  if (hide) {
    // v-click-hide behavior: visible initially, hidden on click
    el.classList.toggle(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, isActive)
    el.classList.toggle(CLASS_VCLICK_HIDDEN_EXP, isActive)
  } else {
    // v-click behavior: hidden initially, visible on click
    el.classList.toggle(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, !isActive)
  }

  el.classList.toggle(CLASS_VCLICK_CURRENT, isCurrent)
  el.classList.toggle(CLASS_VCLICK_PRIOR, prior)
}

/**
 * Element registration metadata for v-click directive binding
 */
interface VClickElementMeta {
  hide: boolean
  fade: boolean
  info: ClicksInfo
}

/**
 * Hook to bind v-click directives in rendered slide DOM
 * Scans for [v-click], [v-after], [v-click-hide] attributes and applies class toggling
 */
function useVClickDirectiveBinding(
  containerRef: React.RefObject<HTMLElement | null>,
  clicksContext: ClicksContext | undefined,
  clicksValue: number,
): void {
  // Keep the registered info: relative positions resolve only at registration.
  const registeredElementsRef = useRef<Map<HTMLElement, VClickElementMeta>>(new Map())

  // First effect: scan DOM and register elements (runs on mount and when container/clicksContext changes)
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !clicksContext) return

    const registeredElements = registeredElementsRef.current
    registeredElements.clear()

    // DOM order matters: v-after shares the immediately preceding click.
    const elements = container.querySelectorAll<HTMLElement>('[v-click], [v-after], [v-click-hide]')
    elements.forEach((el) => {
      const isAfter = el.hasAttribute('v-after')
      const isHide = el.hasAttribute('v-click-hide')
      const attribute = isAfter ? 'v-after' : isHide ? 'v-click-hide' : 'v-click'
      const [at, hide, fade] = parseVClickAttr(el.getAttribute(attribute), isHide)
      const info = clicksContext.calculate(isAfter ? '+0' : at)
      if (info) {
        clicksContext.register(el, info)
        registeredElements.set(el, { hide, fade, info })
        applyVClickClasses(el, info, hide, fade)
      }
    })

    // Cleanup
    return () => {
      registeredElements.forEach((meta, el) => {
        clicksContext.unregister(el)
        el.classList.remove(
          CLASS_VCLICK_TARGET,
          CLASS_VCLICK_HIDDEN,
          CLASS_VCLICK_FADE,
          CLASS_VCLICK_HIDDEN_EXP,
          CLASS_VCLICK_CURRENT,
          CLASS_VCLICK_PRIOR,
        )
      })
      registeredElements.clear()
    }
  }, [containerRef, clicksContext])

  // Second effect: update classes when clicksValue changes (reactive, no polling)
  useLayoutEffect(() => {
    const registeredElements = registeredElementsRef.current
    if (!clicksContext || registeredElements.size === 0) return

    registeredElements.forEach((meta, el) => {
      applyVClickClasses(el, meta.info, meta.hide, meta.fade)
    })
  }, [clicksContext, clicksValue])
}

/**
 * SlideWrapper component - wraps individual slide components
 * Ported from packages/client/internals/SlideWrapper.vue
 */
export default function SlideWrapper({ route, renderContext, clicksContext, clicks }: SlideWrapperProps) {
  const typedRoute = route as TypedSlideRoute
  const zoom = typedRoute.meta?.slide?.frontmatter?.zoom ?? 1
  // Cast component to React component type
  const SlideComponent = route.component as ComponentType | undefined

  // Ref for v-click directive binding
  const containerRef = useRef<HTMLDivElement>(null)

  // Bind v-click directives in rendered DOM (reactive via clicks prop)
  useVClickDirectiveBinding(containerRef, clicksContext, clicks ?? 0)

  // Mark the clicks context mounted so context.total starts reflecting the
  // registered maxMap (Vue injects `$clicksContext.setup()` into every
  // slide module via layoutWrapper; without this, slides with no explicit
  // `clicks:` frontmatter report total=0 and navigation skips all clicks).
  // Layout effect (pre-paint): a keypress arriving right after first paint
  // must already see the correct total, like Vue's onMounted.
  useLayoutEffect(() => {
    containerRef.current?.querySelector('.slidev-layout')?.setAttribute(`data-v-slidev-${route.no}`, '')
    clicksContext?.setup()
  }, [clicksContext, route.no])

  const style = useMemo<CSSProperties>(() => ({
    userSelect: configs.selectable ? undefined : 'none',
    '--slidev-slide-zoom-scale': zoom === 1 ? undefined : zoom,
  } as CSSProperties), [zoom])

  const className = useMemo(() => {
    const classes = ['slidev-page']
    if (!['slide', 'presenter'].includes(renderContext)) {
      classes.push('disable-view-transition')
    }
    // Add slide-specific class
    if (route.no) {
      classes.push(`slidev-page-${route.no}`)
    }
    return classes.join(' ')
  }, [renderContext, route.no])

  if (!SlideComponent) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Slide {route.no} component not loaded</p>
      </div>
    )
  }

  return (
    <SlideContextProvider
      slideNo={route.no}
      route={route}
      zoom={zoom}
      frontmatter={typedRoute.meta?.slide?.frontmatter}
      renderContext={renderContext}
      clicksContext={clicksContext}
      clicks={clicks}
    >
      <div
        ref={containerRef}
        data-slidev-no={route.no}
        className={className}
        style={style}
        lang={typedRoute.meta?.slide?.frontmatter?.lang}
      >
        <SlideBottom />
        <SlideComponent />
        <SlideTop />
        {(__SLIDEV_FEATURE_DRAWINGS__ || __SLIDEV_FEATURE_DRAWINGS_PERSIST__) && !['slide', 'presenter'].includes(renderContext) && <DrawingPreview page={route.no} />}
      </div>
    </SlideContextProvider>
  )
}
