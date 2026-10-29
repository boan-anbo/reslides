import type { SlideRoute } from '@slidev/types'
import type { ScreenshotSession } from '../logic/screenshot'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { parseRangeString } from '@slidev/parser/utils'
import { useDarkMode } from '../hooks/useDarkMode'
import { useNav } from '../hooks/useNav'
import { createClicksContextBase } from '../hooks/useClicks'
import { ExportPdfTip } from '../internals/ExportPdfTip'
import { FormCheckbox } from '../internals/FormCheckbox'
import { FormItem } from '../internals/FormItem'
import { SegmentControl } from '../internals/SegmentControl'
import SlideWrapper from '../internals/SlideWrapper'
import { isColorSchemaConfigured } from '../logic/dark'
import { isScreenshotSupported, startScreenshotSession } from '../logic/screenshot'
import { captureDelay, skipExportPdfTip, subscribeStorage } from '../state/storage'
import { configs, slideHeight, slides, slidesTitle, slideWidth } from '../env'
import PlayPage from './Play'
import './Export.css'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface ScreenshotResultEntry {
  slideIndex: number
  clickIndex: number
  dataUrl: string
}

/**
 * Export page - browser-based slide exporter
 * Faithful port of packages/client/pages/export.vue:
 * options panel (title/range/color mode/with clicks), PDF via print
 * dialog (with ExportPdfTip), PPTX (pptxgenjs) and PNGs.gz (nanotar)
 * via pre-captured screenshots, capture delay control, and a scaled
 * all-slides DOM preview (or the captured-images grid).
 */
export default function ExportPage() {
  const { isPrintWithClicks, printRange, hasNext, go, next, currentSlideNo, clicks } = useNav()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDark, setDark } = useDarkMode()
  const delay = useSyncExternalStore(subscribeStorage, () => captureDelay.value, () => 400)

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState(configs.exportFilename || slidesTitle)
  const [rangesRaw, setRangesRaw] = useState(searchParams.get('range') ?? '')
  const [containerWidth, setContainerWidth] = useState(800)
  const [contentHeight, setContentHeight] = useState(0)
  const [showExportPdfTip, setShowExportPdfTip] = useState(false)
  const [capturedImages, setCapturedImages] = useState<ScreenshotResultEntry[] | null>(null)
  const [session, setSession] = useState<ScreenshotSession | null>(null)
  const sessionRef = useRef<ScreenshotSession | null>(null)

  const scale = containerWidth / slideWidth
  const contentMarginBottom = contentHeight * (scale - 1)

  useEffect(() => {
    document.title = title
  }, [title])

  // Vue: watchDebounced([slides, rangesRaw]) -> printRange (the ?range param)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev: URLSearchParams) => {
        const nextParams = new URLSearchParams(prev)
        if (rangesRaw.trim())
          nextParams.set('range', rangesRaw)
        else
          nextParams.delete('range')
        return nextParams
      }, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [rangesRaw, setSearchParams])

  const setWithClicks = useCallback((v: boolean) => {
    setSearchParams((prev: URLSearchParams) => {
      const nextParams = new URLSearchParams(prev)
      nextParams.set('print', v ? 'clicks' : 'true')
      return nextParams
    }, { replace: true })
  }, [setSearchParams])

  // Measure preview container/content (Vue useElementSize)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      setContainerWidth(container.clientWidth)
      if (contentRef.current)
        setContentHeight(contentRef.current.clientHeight)
    })
    observer.observe(container)
    if (contentRef.current)
      observer.observe(contentRef.current)
    setContainerWidth(container.clientWidth)
    return () => observer.disconnect()
  })

  // Vue useStyleTag: capture-mode body lockdown / preview scale variable
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = session?.isActive.value
      ? `
html { cursor: none; margin-bottom: 20px; }
body { pointer-events: none; }`
      : `
:root { --slidev-slide-scale: ${scale}; }`
    document.head.appendChild(el)
    return () => { document.head.removeChild(el) }
  }, [session, scale])

  // Clear captured images when settings change (Vue watch)
  const rangeKey = printRange.join(',')
  useEffect(() => {
    setCapturedImages(null)
  }, [isDark, rangeKey, isPrintWithClicks])

  function pdf() {
    if (skipExportPdfTip.value)
      doPrint()
    else
      setShowExportPdfTip(true)
  }

  function doPrint() {
    // patchMonacoColors: Monaco is not ported; nothing to patch
    setTimeout(() => window.print(), 100)
  }

  async function capturePngs(): Promise<ScreenshotResultEntry[] | null> {
    if (sessionRef.current) {
      sessionRef.current.dispose()
      sessionRef.current = null
      setSession(null)
    }
    if (capturedImages)
      return capturedImages

    let result: ScreenshotResultEntry[] | null = null
    try {
      const captureScale = 2
      const newSession = await startScreenshotSession(slideWidth * captureScale, slideHeight * captureScale)
      sessionRef.current = newSession
      setSession(newSession)
      const captured: ScreenshotResultEntry[] = []

      go(1, 0, true)

      await sleep(1000 + captureDelay.value)
      while (true) {
        if (!sessionRef.current)
          break
        const slideContent = document.getElementById('slide-content')
        if (!slideContent)
          break
        captured.push({
          slideIndex: currentSlideNoLive() - 1,
          clickIndex: clicksLive(),
          dataUrl: sessionRef.current.screenshot(slideContent),
        })
        if (hasNextLive()) {
          await sleep(captureDelay.value)
          next()
          await sleep(captureDelay.value)
        }
        else {
          break
        }
      }

      if (sessionRef.current) {
        sessionRef.current.dispose()
        sessionRef.current = null
        setSession(null)
        result = captured
        setCapturedImages(captured)
      }
    }
    catch (e) {
      console.error(e)
      setCapturedImages(null)
    }
    finally {
      navigate('/export')
    }
    return result
  }

  // The capture loop runs across navigations - read live values through
  // refs refreshed each render (Vue reads reactive refs directly)
  const liveRef = useRef({ currentSlideNo, clicks, hasNext })
  liveRef.current = { currentSlideNo, clicks, hasNext }
  const currentSlideNoLive = () => liveRef.current.currentSlideNo
  const clicksLive = () => liveRef.current.clicks
  const hasNextLive = () => liveRef.current.hasNext

  async function pptx() {
    const pngs = await capturePngs()
    if (!pngs)
      return
    const PptxGen = await import('pptxgenjs').then(r => r.default)
    const doc = new PptxGen()

    const layoutName = `${slideWidth}x${slideHeight}`
    doc.defineLayout({
      name: layoutName,
      width: slideWidth / 96,
      height: slideHeight / 96,
    })
    doc.layout = layoutName
    if (configs.author)
      doc.author = configs.author
    doc.company = 'Created using Slidev'
    doc.title = title
    if (typeof configs.info === 'string')
      doc.subject = configs.info

    pngs.forEach(({ slideIndex, dataUrl }) => {
      const slide = doc.addSlide()
      slide.background = { data: dataUrl }
      const note = (slides[slideIndex]?.meta as { slide?: { note?: string } })?.slide?.note
      if (note)
        slide.addNotes(note)
    })

    const blob = await doc.write({ outputType: 'blob', compression: true }) as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.pptx`
    a.click()
  }

  async function pngsGz() {
    const pngs = await capturePngs()
    if (!pngs)
      return
    const { createTarGzip } = await import('nanotar')
    const data = await createTarGzip(
      pngs.map(({ slideIndex, dataUrl }) => ({
        name: `${slideIndex}.png`,
        data: new Uint8Array(atob(dataUrl.split(',')[1]).split('').map(char => char.charCodeAt(0))),
      })),
    )
    const a = document.createElement('a')
    const blob = new Blob([data], { type: 'application/gzip' })
    a.href = URL.createObjectURL(blob)
    a.download = `${title}.tar.gz`
    a.click()
  }

  // While a screenshot session is active, render the real Play view so the
  // capture sees the actual presentation (Vue: <Play v-if="...isActive" />)
  if (session?.isActive.value)
    return <PlayPage />

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row md:gap-8 print:position-unset print:inset-0 print:block print:min-h-max justify-center of-hidden bg-main">
      <div className="print:hidden min-w-fit flex flex-wrap md:flex-nowrap md:of-y-auto md:flex-col gap-2 p-6 max-w-100">
        <h1 className="text-3xl md:my-4 flex items-center gap-2 w-full">
          <Link to="/" className="i-carbon:previous-outline op-70 hover:op-100" />
          Browser Exporter
          <sup className="op50 italic text-sm">Experimental</sup>
        </h1>
        <div className="flex flex-col gap-2">
          <h2>Options</h2>
          <FormItem title="Title">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
          </FormItem>
          <FormItem title="Range">
            <input
              type="text"
              value={rangesRaw}
              placeholder={`1-${slides.length}`}
              onChange={e => setRangesRaw(e.target.value)}
            />
          </FormItem>
          <FormItem title="Color Mode">
            <SegmentControl
              value={isDark}
              onChange={(v: boolean) => setDark(v)}
              options={[
                { value: false, label: 'Light' },
                { value: true, label: 'Dark' },
              ]}
              disabled={isColorSchemaConfigured.value}
            />
          </FormItem>
          <FormItem title="With clicks">
            <FormCheckbox value={isPrintWithClicks} onChange={setWithClicks} />
          </FormItem>
        </div>
        <div className="flex-grow" />
        <div className="min-w-fit flex flex-col gap-3">
          <div className="border border-main rounded-lg p-3 flex flex-col gap-2">
            <h2>Export as Vector File</h2>
            <div className="flex flex-col gap-2 min-w-max">
              <button className="slidev-form-button" onClick={pdf}>
                PDF
              </button>
            </div>
          </div>

          <div className={`border border-main rounded-lg p-3 flex flex-col gap-2 ${isScreenshotSupported ? '' : 'border-orange'}`}>
            <h2>Export as Images</h2>
            {!isScreenshotSupported && (
              <div className="min-w-full w-0 text-orange p-1 mb-2 bg-orange/10 rounded">
                <span className="i-carbon:warning-alt inline-block mb--.5" />
                Your browser may not support image capturing.
                If you encounter issues, please use a modern Chromium-based browser,
                or export via the CLI.
              </div>
            )}
            <div className="flex flex-col gap-2 min-w-max">
              <button className="slidev-form-button" onClick={pptx}>
                PPTX
              </button>
              <button className="slidev-form-button" onClick={pngsGz}>
                PNGs.gz
              </button>
            </div>
            <div className="w-full h-1px border-t border-main my-2" />
            <div className="relative flex flex-col gap-2 flex-nowrap">
              <div className="flex flex-col gap-2 min-w-max">
                {capturedImages
                  ? (
                      <button className="slidev-form-button flex justify-center items-center gap-2" onClick={() => setCapturedImages(null)}>
                        <span className="i-carbon:trash-can inline-block text-xl" />
                        Clear Captured Images
                      </button>
                    )
                  : (
                      <button className="slidev-form-button flex justify-center items-center gap-2" onClick={capturePngs}>
                        <div className="i-carbon:drop-photo inline-block text-xl" />
                        Pre-capture slides as Images
                      </button>
                    )}
                <FormItem
                  title="Delay"
                  description={'Delay between capturing each slide in milliseconds.<br>Increase this value if slides are captured incompletely. <br>(Not related to PDF export)'}
                >
                  <input
                    type="number"
                    step={50}
                    min={50}
                    value={delay}
                    onChange={e => { captureDelay.value = +e.target.value }}
                  />
                </FormItem>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="export-container" ref={containerRef} className="relative">
        <div className="print:hidden fixed right-5 bottom-5 px-2 py-0 z-label slidev-glass-effect">
          <span className="op75">Rendering as {capturedImages ? 'Captured Images' : 'DOM'} </span>
        </div>
        <div
          id="export-content"
          ref={contentRef}
          style={{
            display: capturedImages ? 'none' : undefined,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            marginBottom: `${contentMarginBottom}px`,
          }}
        >
          {slides.map((route, index) => (
            <ExportSlide
              key={index}
              route={route}
              hidden={!printRange.includes(index + 1)}
              withClicks={isPrintWithClicks}
            />
          ))}
        </div>
        {capturedImages && (
          <div id="export-content-images" className="print:hidden grid">
            {capturedImages.map((png, i) => (
              <div key={i} className="print-slide-container">
                <img src={png.dataUrl} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div id="twoslash-container" />
      <ExportPdfTip
        open={showExportPdfTip}
        onClose={() => setShowExportPdfTip(false)}
        onPrint={doPrint}
      />
    </div>
  )
}

interface ExportSlideProps {
  route: SlideRoute
  hidden?: boolean
  withClicks?: boolean
}

/**
 * Renders one slide's export frames (all click states when withClicks).
 * Mirrors internals/PrintSlide.vue + PrintSlideClick.vue.
 */
function ExportSlide({ route, hidden, withClicks }: ExportSlideProps) {
  const meta = route?.meta as { clicks?: number, slide?: { frontmatter?: { clicksStart?: number } } } | undefined
  const clicksStart = meta?.slide?.frontmatter?.clicksStart ?? 0
  const clicksTotal = meta?.clicks ?? 0

  const clickStates = useMemo(() => {
    if (!withClicks) {
      // Final state, all clicks revealed (Vue: createFixedClicks CLICKS_MAX)
      return [99999]
    }
    const states: number[] = [clicksStart]
    for (let i = clicksStart + 1; i <= Math.max(clicksStart, clicksTotal); i++)
      states.push(i)
    return states
  }, [withClicks, clicksStart, clicksTotal])

  return (
    <>
      {clickStates.map(clickState => (
        <ExportSlideFrame
          key={`${route.no}-${clickState}`}
          route={route}
          clicks={clickState}
          hidden={hidden}
        />
      ))}
    </>
  )
}

interface ExportSlideFrameProps {
  route: SlideRoute
  clicks: number
  hidden?: boolean
}

function ExportSlideFrame({ route, clicks, hidden }: ExportSlideFrameProps) {
  const meta = route?.meta as { clicks?: number, slide?: { frontmatter?: { clicksStart?: number } } } | undefined
  const clicksStart = meta?.slide?.frontmatter?.clicksStart ?? 0

  const clicksContext = useMemo(() => {
    return createClicksContextBase(
      () => clicks,
      () => {},
      clicksStart,
      meta?.clicks,
    )
  }, [clicks, clicksStart, meta?.clicks])

  return (
    <div
      // Vue .print-slide-container: relative overflow-hidden
      // break-after-page translate-0 bg-main
      className="print-slide-container bg-main relative overflow-hidden"
      style={{
        width: `${slideWidth}px`,
        height: `${slideHeight}px`,
        breakAfter: 'page',
        transform: 'translate(0, 0)',
        display: hidden ? 'none' : undefined,
      }}
    >
      <SlideWrapper
        route={route}
        renderContext="print"
        clicksContext={clicksContext}
        clicks={clicks}
      />
    </div>
  )
}
