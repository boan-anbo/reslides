/** Quick slide picker with real previews and an independent keyboard selection. */
import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNav } from '../hooks/useNav'
import { createClicksContextBase } from '../hooks/useClicks'
import { CLICKS_MAX } from '../constants'
import { currentOverviewPage, overviewRowCount, subscribeOverview, nextOverviewPage, prevOverviewPage, upOverviewPage, downOverviewPage } from '../logic/overview'
import { showOverview, subscribeStorage } from '../state/storage'
import { titleText } from '../logic/titles'
import { IconButton } from './IconButton'
import SlideContainer from './SlideContainer'
import SlideWrapper from './SlideWrapper'
import type { SlideRoute } from '@slidev/types'

export function setShowOverview(value: boolean) { showOverview.value = value }
export function getShowOverview() { return showOverview.value }
export function toggleOverview() { showOverview.value = !showOverview.value }
export function useShowOverview() {
  const show = useSyncExternalStore(subscribeStorage, getShowOverview, () => false)
  return { show, setShow: setShowOverview }
}

function slideTitle(route: SlideRoute): string {
  const slide = route.meta?.slide
  return slide && typeof slide === 'object' && 'title' in slide
    ? titleText(slide.title, `Slide ${route.no}`)
    : `Slide ${route.no}`
}

function Preview({ route, width }: { route: SlideRoute, width: number }) {
  const [clicks] = useState(() => createClicksContextBase(() => CLICKS_MAX, () => {}))
  return <SlideContainer width={width}><Suspense fallback={null}><SlideWrapper route={route} renderContext="overview" clicksContext={clicks} clicks={CLICKS_MAX} /></Suspense></SlideContainer>
}

export function QuickOverview() {
  const { currentSlideNo, go: goSlide, slides } = useNav()
  const { show } = useShowOverview()
  const selected = useSyncExternalStore(subscribeOverview, () => currentOverviewPage.value, () => 1)
  const [keyboardBuffer, setKeyboardBuffer] = useState('')
  const [columns, setColumns] = useState(1)
  const [cardWidth, setCardWidth] = useState(300)
  const gridRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => { showOverview.value = false }, [])
  const go = useCallback((no: number) => {
    if (!slides.some(route => route.no === no)) return
    void goSlide(no)
    close()
  }, [goSlide, slides, close])

  useEffect(() => {
    if (!show) return
    currentOverviewPage.value = currentSlideNo
    setKeyboardBuffer('')
    // Remove focus from the toolbar trigger so the picker owns keyboard input.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }, [show, currentSlideNo])

  useEffect(() => {
    const grid = gridRef.current
    if (!show || !grid) return
    const measure = () => {
      const width = grid.clientWidth
      const count = Math.max(1, Math.floor((width + 24) / 324))
      overviewRowCount.value = count
      setColumns(count)
      setCardWidth((width - (count - 1) * 24) / count)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [show])

  useEffect(() => { selectedRef.current?.scrollIntoView({ block: 'nearest' }) }, [selected, show])
  useEffect(() => {
    if (!show) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      const moves: Record<string, () => void> = { ArrowLeft: prevOverviewPage, ArrowRight: nextOverviewPage, ArrowUp: upOverviewPage, ArrowDown: downOverviewPage }
      if (event.key in moves) {
        event.preventDefault()
        setKeyboardBuffer('')
        moves[event.key]()
      }
      else if (event.key === 'Escape' || event.key === 'o' || event.key === '`') { event.preventDefault(); close() }
      else if (event.key === 'Enter') { event.preventDefault(); go(keyboardBuffer ? Number(keyboardBuffer) : currentOverviewPage.value) }
      else if (/^[0-9]$/.test(event.key)) {
        event.preventDefault()
        const value = keyboardBuffer + event.key
        const no = Number(value)
        if (no < 1 || no > slides.length) { setKeyboardBuffer(''); return }
        setKeyboardBuffer(value)
        if (no * 10 > slides.length) go(no)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [show, selected, keyboardBuffer, slides.length, go, close])

  if (!show) return null
  return (
    <div role="dialog" aria-label="Slide overview" className="fixed inset-0 z-modal bg-main/95 p-6 pt-16 overflow-y-auto backdrop-blur-sm" onClick={close}>
      <div ref={gridRef} className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {slides.map(route => (
          <div key={route.no} ref={route.no === selected ? selectedRef : undefined}>
            <div role="button" tabIndex={0} aria-label={`Go to slide ${route.no}`} aria-current={route.no === selected ? 'page' : undefined} className={`block w-full border-2 rounded overflow-hidden bg-main ${route.no === selected ? 'border-primary' : 'border-main'}`} onClick={event => { event.stopPropagation(); go(route.no) }} onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); go(route.no) }
            }}>
              <div ref={element => { if (element) element.inert = true }} aria-hidden="true" className="pointer-events-none"><Preview route={route} width={cardWidth - 4} /></div>
            </div>
            <div className="flex gap-2 mt-1 text-sm"><span className="opacity-50">{route.no}</span><span>{slideTitle(route)}</span></div>
          </div>
        ))}
      </div>
      <div className="fixed top-3 right-4 flex gap-2 bg-main rounded">
        <IconButton title="Close overview" onClick={close}><div className="i-carbon:close" /></IconButton>
        <IconButton title="Slides Overview" to="/overview"><div className="i-carbon:list-boxes" /></IconButton>
      </div>
    </div>
  )
}
