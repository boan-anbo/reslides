import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../hooks/useNav'
import { createClicksContextBase } from '../hooks/useClicks'
import SlideWrapper from '../internals/SlideWrapper'
import { CLICKS_MAX } from '../constants'
import './Overview.css'

/**
 * Overview page - slide overview with thumbnails and notes
 * Ported from packages/client/pages/overview.vue
 */
export default function OverviewPage() {
  const navigate = useNavigate()
  const { slides, currentSlideNo, isPresenter } = useNav()
  const [activeBlocks, setActiveBlocks] = useState<number[]>([])
  const blocksRef = useRef<Map<number, HTMLElement>>(new Map())
  const mainRef = useRef<HTMLDivElement>(null)

  const cardWidth = 450

  // Create clicks context for each slide (for preview)
  const clicksContextMap = useMemo(() => {
    const map = new Map()
    slides.forEach(route => {
      const meta = route.meta as { clicks?: number, slide?: { frontmatter?: { clicksStart?: number } } } | undefined
      const clicksStart = meta?.slide?.frontmatter?.clicksStart ?? 0
      const clicksRef = { current: CLICKS_MAX }
      const ctx = createClicksContextBase(
        () => clicksRef.current,
        (v: number) => { clicksRef.current = v },
        clicksStart,
        meta?.clicks,
      )
      map.set(route.no, ctx)
    })
    return map
  }, [slides])

  // Word count for notes
  const wordCount = useCallback((str: string) => {
    const pattern = /[\w`'\-\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
    const m = str.match(pattern)
    if (!m) return 0
    let count = 0
    for (const word of m) {
      if (word.charCodeAt(0) >= 0x4E00) {
        count += word.length
      } else {
        count += 1
      }
    }
    return count
  }, [])

  // Calculate totals
  const stats = useMemo(() => {
    let totalWords = 0
    let totalClicks = 0
    slides.forEach(route => {
      const meta = route.meta as { clicks?: number, slide?: { note?: string } } | undefined
      totalWords += wordCount(meta?.slide?.note || '')
      totalClicks += meta?.clicks || 0
    })
    return { totalWords, totalClicks }
  }, [slides, wordCount])

  // Check which slides are in viewport
  const checkActiveBlocks = useCallback(() => {
    const active: number[] = []
    blocksRef.current.forEach((el, idx) => {
      const rect = el.getBoundingClientRect()
      const delta = 20
      const inViewport = (
        rect.top >= 0 - delta &&
        rect.left >= 0 - delta &&
        rect.bottom <= window.innerHeight + delta &&
        rect.right <= window.innerWidth + delta
      )
      if (inViewport) active.push(idx)
    })
    setActiveBlocks(active)
  }, [])

  // Check on mount and scroll
  useEffect(() => {
    checkActiveBlocks()
  }, [checkActiveBlocks])

  const scrollToSlide = useCallback((idx: number) => {
    const el = blocksRef.current.get(idx)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const goToSlide = useCallback((no: number) => {
    navigate(isPresenter ? `/presenter/${no}` : `/${no}`)
  }, [navigate, isPresenter])

  return (
    <div className="overview-page h-screen w-screen overflow-hidden flex">
      {/* Sidebar navigation */}
      <nav className="overview-nav border-r border-main select-none flex flex-col">
        <div className="flex-auto overflow-y-auto overflow-x-visible p-2">
          <div className="flex flex-col items-end gap-1">
            {slides.map((route, idx) => (
              <button
                key={route.no}
                className={`overview-nav-btn ${activeBlocks.includes(idx) ? 'active' : ''}`}
                onClick={() => scrollToSlide(idx)}
                title={`Slide ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t border-main">
          <button
            className="overview-back-btn"
            onClick={() => navigate(`/${currentSlideNo}`)}
            title="Back to presentation"
          >
            ← Back
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main
        ref={mainRef}
        className="flex-1 h-full overflow-auto"
        onScroll={checkActiveBlocks}
      >
        {slides.map((route, idx) => {
          const meta = route.meta as { clicks?: number, slide?: { noteHTML?: string, note?: string, title?: string } } | undefined
          // Prefer noteHTML (pre-rendered), fallback to note for backwards compatibility
          const note = meta?.slide?.noteHTML || meta?.slide?.note || ''
          const words = wordCount(note)
          const clicksCtx = clicksContextMap.get(route.no)

          return (
            <div
              key={route.no}
              ref={el => el && blocksRef.current.set(idx, el)}
              className={`overview-slide-row ${idx === 0 ? 'first' : ''}`}
            >
              {/* Slide number */}
              <div className="overview-slide-number">
                <div className="text-3xl opacity-20 mb-2">{idx + 1}</div>
                <button
                  className="overview-action-btn"
                  onClick={() => goToSlide(route.no)}
                  title="Go to slide"
                >
                  ▶
                </button>
              </div>

              {/* Slide preview */}
              <div className="overview-slide-preview" style={{ width: cardWidth }}>
                <div
                  className="overview-slide-container"
                  onDoubleClick={() => goToSlide(route.no)}
                >
                  <Suspense fallback={null}>
                    {clicksCtx && (
                      <SlideWrapper
                        route={route}
                        clicksContext={clicksCtx}
                        renderContext="overview"
                      />
                    )}
                  </Suspense>
                </div>
                {(meta?.clicks ?? 0) > 0 && (
                  <div className="overview-clicks-info">
                    {meta?.clicks} clicks
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="overview-notes">
                {note ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: note }}
                  />
                ) : (
                  <div className="text-gray-400 italic">No notes</div>
                )}
                {words > 0 && (
                  <div className="overview-word-count">{words} words</div>
                )}
              </div>
            </div>
          )
        })}
      </main>

      {/* Stats banner */}
      <div className="overview-stats">
        {slides.length} slides · {stats.totalClicks + slides.length - 1} clicks · {stats.totalWords} words
      </div>
    </div>
  )
}
