import type { SlideRoute, ClicksContext } from '@slidev/types'
import { useEffect, useMemo, useRef } from 'react'
import { useNav } from '../hooks/useNav'
import { createClicksContextBase } from '../hooks/useClicks'
import SlideWrapper from '../internals/SlideWrapper'
import { configs, slides, slideWidth, slideHeight, slideAspect } from '../env'
import { CLICKS_MAX } from '../constants'
// @ts-ignore - Virtual module
import { GlobalBottom, GlobalTop } from '#slidev/global-layers'
import './Print.css'

/**
 * Print page - renders all slides in print layout
 * Ported from packages/client/pages/print.vue
 */
export default function PrintPage() {
  const { printRange, isPrintWithClicks } = useNav()

  // Add print class to html element on mount
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('print')
    return () => html.classList.remove('print')
  }, [])

  // Generate print styles dynamically
  useEffect(() => {
    const styleId = 'slidev-print-styles'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = `
      @page {
        size: ${slideWidth}px ${slideHeight}px;
        margin: 0;
      }
      @media print {
        .print-slide-container {
          width: ${slideWidth}px;
          height: ${slideHeight}px;
          page-break-after: always;
        }
      }
    `

    return () => {
      styleEl?.remove()
    }
  }, [slideWidth, slideHeight])

  return (
    <div id="page-root" className="print-page grid grid-cols-[1fr_max-content]">
      <div
        id="print-container"
        className="w-full h-full"
        style={{ background: 'var(--slidev-slide-container-background, black)' }}
      >
        <div id="print-content">
          {printRange.map((no) => (
            <PrintSlide
              key={no}
              route={slides[no - 1]}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              withClicks={isPrintWithClicks}
            />
          ))}
        </div>
      </div>
      <div id="twoslash-container" />
    </div>
  )
}

interface PrintSlideProps {
  route: SlideRoute
  slideWidth: number
  slideHeight: number
  withClicks?: boolean
}

/**
 * PrintSlide component - renders a single slide for printing
 * If withClicks is true, renders multiple versions for each click state
 * Ported from packages/client/internals/PrintSlide.vue
 */
function PrintSlide({ route, slideWidth, slideHeight, withClicks }: PrintSlideProps) {
  const meta = route?.meta as { clicks?: number; slide?: { frontmatter?: { clicksStart?: number } } } | undefined
  const clicksStart = meta?.slide?.frontmatter?.clicksStart ?? 0
  const clicksTotal = meta?.clicks ?? 0

  // Generate click states to render
  // Vue: withClicks=false uses CLICKS_MAX (fully expanded final state)
  // Vue: withClicks=true loops clicksStart..clicksTotal
  const clickStates = useMemo(() => {
    if (!withClicks) {
      // Print final state: CLICKS_MAX unconditionally (Vue:
      // createFixedClicks(route, CLICKS_MAX)). meta.clicks is usually
      // undefined - deriving the state from it printed slides with
      // component-based v-clicks at clicks=0, i.e. with every item hidden.
      return [CLICKS_MAX]
    }
    // Print all click states from start to total
    // Vue: Math.max(0, clicks0.total - clicks0.clicksStart) iterations
    const count = Math.max(0, clicksTotal - clicksStart)
    const states: number[] = [clicksStart] // First state at clicksStart
    for (let i = 1; i <= count; i++) {
      states.push(i + clicksStart)
    }
    return states
  }, [withClicks, clicksStart, clicksTotal])

  return (
    <>
      {clickStates.map((clickState) => (
        <PrintSlideClick
          key={`${route.no}-${clickState}`}
          route={route}
          clicks={clickState}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
        />
      ))}
    </>
  )
}

interface PrintSlideClickProps {
  route: SlideRoute
  clicks: number
  slideWidth: number
  slideHeight: number
}

/**
 * PrintSlideClick - single click state rendering for print mode
 * Ported from packages/client/internals/PrintSlideClick.vue
 *
 * CRITICAL: Must use class="print-slide-container" and id="${no}-${clicks+1}"
 * for PNG export to work (export.ts uses .print-slide-container selector)
 */
function PrintSlideClick({ route, clicks, slideWidth, slideHeight }: PrintSlideClickProps) {
  const meta = route?.meta as { clicks?: number; slide?: { frontmatter?: { clicksStart?: number } } } | undefined
  const clicksStart = meta?.slide?.frontmatter?.clicksStart ?? 0

  // Create fixed clicks context for this frame
  const clicksContext = useMemo<ClicksContext>(() => {
    return createClicksContextBase(
      () => clicks,
      () => {},
      clicksStart,
      meta?.clicks,
    )
  }, [clicks, clicksStart, meta?.clicks])

  // Generate ID matching Vue format: ${no.padStart(3, '0')}-${(clicks+1).padStart(2, '0')}
  const id = useMemo(() => {
    const noStr = route.no.toString().padStart(3, '0')
    const clicksStr = (clicks + 1).toString().padStart(2, '0')
    return `${noStr}-${clicksStr}`
  }, [route.no, clicks])

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      id={id}
      ref={containerRef}
      // bg-main, not the dark container fallback: Vue's scoped style is
      // `relative overflow-hidden break-after-page translate-0 bg-main` -
      // a hardcoded dark background printed every slide black-on-black
      className="print-slide-container bg-main relative overflow-hidden"
      style={{
        width: `${slideWidth}px`,
        height: `${slideHeight}px`,
        breakAfter: 'page',
        transform: 'translate(0, 0)',
      }}
    >
      <GlobalBottom />

      <SlideWrapper
        route={route}
        renderContext="print"
        clicksContext={clicksContext}
        clicks={clicks}
      />

      <GlobalTop />
    </div>
  )
}
