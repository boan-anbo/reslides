import type { CSSProperties, ReactNode, RefObject } from 'react'
import { createContext, useContext, useId, useLayoutEffect, useState } from 'react'
import { useSlideContext } from '@slidev/client/context.tsx'

const pad = (n: number) => String(n).padStart(2, '0')

/** Current slide number and deck length. */
export function usePageNo() {
  const { $page, $nav } = useSlideContext()
  const page = $page || 1
  const total = $nav?.total || 0
  return { page, total, no: pad(page), nav: $nav }
}

/** Top line: section kicker on the left, optional `meta` on the right. */
export function Rail({ kicker, meta }: { kicker?: ReactNode, meta?: ReactNode }) {
  if (!kicker && !meta)
    return null
  return (
    <div className="rail">
      <span className="kick">{kicker}</span>
      {meta && <span className="meta">{meta}</span>}
    </div>
  )
}

/** CSS variable that puts the slide number before the h1. */
export function numberStyle(no: string): CSSProperties {
  return { ['--dh-no' as string]: `"${no}"` } as CSSProperties
}

/** Steps of the current slide, shared with the stepper. */
const StepsContext = createContext<{ step: number, steps: number }>({ step: 0, steps: 0 })
export const StepsProvider = StepsContext.Provider

/**
 * Step-through, as the guide's figures: every element under `ref` with `data-s="n"` is a step.
 * Step 1 shows with the slide; each click brings the next number into focus. Elements get
 * data-phase="past" | "current" | "future", which the stylesheet turns into ink, red marker and faint.
 * Elements that share a number step together. The slide registers steps − 1 clicks with Slidev.
 */
export function useSteps(ref: RefObject<HTMLElement | null>) {
  const { $clicksContext, $clicks } = useSlideContext()
  const [steps, setSteps] = useState(0)
  const id = useId()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el)
      return
    const nums = Array.from(el.querySelectorAll('[data-s]')).map(e => Number(e.getAttribute('data-s')) || 0)
    const max = nums.length ? Math.max(...nums) : 0
    setSteps(max)
    if ($clicksContext && max > 1) {
      $clicksContext.register(id, { delta: max - 1, max: max - 1 } as any)
      return () => $clicksContext.unregister(id)
    }
  }, [$clicksContext, id, ref])

  const step = steps ? Math.min(($clicks || 0) + 1, steps) : 0

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !steps)
      return
    el.querySelectorAll('[data-s]').forEach((e) => {
      const s = Number(e.getAttribute('data-s')) || 0
      e.setAttribute('data-phase', s < step ? 'past' : s === step ? 'current' : 'future')
    })
  }, [ref, step, steps])

  return { step, steps }
}

/**
 * Fit: a `.body` that is shorter than the free space under the title is scaled up (at most `max`,
 * default 1.35) and centred in it. It is laid out narrower first, so the scaled width still fits.
 * A body taller than the space is scaled down instead (to 0.75 at least).
 * A body that already fills the space, or has class `nofit`, is left alone; one with a bar chart is only centred.
 * Frontmatter `fit: false` turns it off for a slide; `fit: 1.2` sets that slide's maximum.
 */
export function useFit(ref: RefObject<HTMLElement | null>, fit: boolean | number = true) {
  useLayoutEffect(() => {
    const main = ref.current
    if (!main || fit === false)
      return
    const max = typeof fit === 'number' ? fit : 1.35
    const run = () => {
      const body = main.querySelector<HTMLElement>(':scope > .body')
      if (!body || body.classList.contains('nofit'))
        return
      const s = body.style
      s.flex = s.width = s.transform = s.transformOrigin = s.marginBottom = ''
      const freeH = body.offsetHeight, freeW = body.offsetWidth
      if (!freeH || !freeW)
        return
      s.flex = 'none'
      const natural = body.offsetHeight
      // pictures size themselves to the space, so a body with one only ever grows
      const over = natural > freeH + 1 && !body.querySelector('.pic')
      if (!over && natural * 1.04 >= freeH) {
        s.flex = ''
        return
      }
      // a scale fits if the narrowed body is short enough and nothing in it overflows sideways
      // (frame labels do not wrap; a chart's free track would shrink, so charts are not narrowed)
      const fits = (k: number) => {
        s.width = `${freeW / k}px`
        if (body.offsetHeight * k > freeH || body.scrollWidth > body.clientWidth + 1)
          return false
        // a frame's label keeps a little air before the frame's right edge
        return !Array.from(body.querySelectorAll<HTMLElement>('.frame')).some((f) => {
          const label = f.querySelector<HTMLElement>(':scope > .label')
          return f.scrollWidth > f.clientWidth + 1 || (label && label.offsetLeft + label.offsetWidth > f.clientWidth - 24)
        })
      }
      // too tall: shrink, down to 0.75 at most; too short: grow
      let lo = over ? 0.75 : 1, hi = over || body.querySelector('.bars') ? 1 : max
      if (!fits(hi)) {
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2
          if (fits(mid)) lo = mid
          else hi = mid
        }
        hi = lo
      }
      s.width = `${freeW / hi}px`
      const h = body.offsetHeight
      s.transformOrigin = 'top left'
      s.transform = `translateY(${Math.max(0, (freeH - h * hi) / 2)}px) scale(${hi})`
      // the layout box keeps its unscaled height; match it to the scaled one so nothing scrolls
      s.marginBottom = `${h * hi - h}px`
      main.scrollTop = 0
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(main)
    const onLoad = (e: Event) => { if ((e.target as Element)?.tagName === 'IMG') run() }
    main.addEventListener('load', onLoad, true)
    document.fonts?.ready.then(run)
    return () => { ro.disconnect(); main.removeEventListener('load', onLoad, true) }
  }, [ref, fit])
}

/**
 * Page stepper, as dhguide.org's step control (data-chat-stepper):
 * previous · progress track · "2/15" · next. No restart button: a stray click must not jump back to the start.
 * The track has a fixed width, cut into as many slices as the deck has pages; slices stay lit as the talk
 * advances (red, up to and including the current page). The arrows move one step at a time (a click on a stepped slide, otherwise a slide).
 */
export function Stepper() {
  const { page, total, nav } = usePageNo()
  const { step, steps } = useContext(StepsContext)
  const first = page <= 1 && step <= 1
  const last = page >= total && step >= steps
  return (
    <div className="stepper">
      <button type="button" className="prev" aria-label="Previous step" title="Previous step" disabled={first} onClick={() => nav?.prev()}>
        <svg aria-hidden="true" viewBox="0 0 8 12"><path d="M6.5 1 1.5 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
      </button>
      <span className="track" aria-label={`Page ${page} of ${total}`}>
        {Array.from({ length: total }, (_, i) => <i key={i} className={i + 1 < page ? 'done' : i + 1 === page ? 'on' : ''} />)}
      </span>
      <span role="status" className="count">{page}/{total}</span>
      <button type="button" className="next" aria-label="Next step" title="Next step" disabled={last} onClick={() => nav?.next()}>
        <svg aria-hidden="true" viewBox="0 0 8 12"><path d="M1.5 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
      </button>
    </div>
  )
}

/**
 * Bottom line: two slots. Left: `foot` (source line, byline). Right: `right`, which defaults
 * to the page stepper; `stepper: false` leaves the right slot empty unless `::right::` fills it.
 */
export function Bottom({ foot, right, stepper = true, className = '' }: { foot?: ReactNode, right?: ReactNode, stepper?: boolean, className?: string }) {
  const r = right ?? (stepper ? <Stepper /> : null)
  if (!foot && !r)
    return null
  return (
    <div className={`bottom ${className}`}>
      <div className="foot">{foot}</div>
      {r && <div className="right">{r}</div>}
    </div>
  )
}
