/**
 * Presenter page - presenter view with current slide, next preview, notes,
 * nav controls and timer.
 * Ported from packages/client/pages/presenter.vue
 *
 * Resizable panel geometry follows Slidev v52.19.1.
 */
import type { ClicksContext } from '@slidev/types'
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createClicksContextBase } from '../hooks/useClicks'
import { useDrawings } from '../hooks/useDrawings'
import { useNav } from '../hooks/useNav'
import { useLoadedSlide } from '../hooks/useLoadedSlide'
import { usePresenterResize } from '../hooks/usePresenterResize'
import { useSwipeControls } from '../hooks/useSwipeControls'
import { useWakeLock } from '../hooks/useWakeLock'
import { slidesTitle } from '../env'
import { ContextMenu } from '../internals/ContextMenu'
import { ClicksSlider } from '../internals/ClicksSlider'
import { CurrentProgressBar } from '../internals/CurrentProgressBar'
import { DrawingControls } from '../internals/DrawingControls'
import { Goto } from '../internals/Goto'
import { IconButton } from '../internals/IconButton'
import { NavControls } from '../internals/NavControls'
import { NoteEditable } from '../internals/NoteEditable'
import { NoteStatic } from '../internals/NoteStatic'
import { QuickOverview } from '../internals/QuickOverview'
import { ScreenCaptureMirror } from '../internals/ScreenCaptureMirror'
import { SegmentControl } from '../internals/SegmentControl'
import { SideEditor, useShowEditor } from '../internals/SideEditor'
import { useContextMenu } from '../logic/contextMenu'
import SlideContainer from '../internals/SlideContainer'
import SlidesShow from '../internals/SlidesShow'
import SlideWrapper from '../internals/SlideWrapper'
import { TimerBar } from '../internals/TimerBar'
import { TimerInlined } from '../internals/TimerInlined'
import { registerShortcuts, useShortcutNav } from '../logic/shortcuts'
import {
  decreasePresenterFontSize,
  increasePresenterFontSize,
  presenterLayout,
  presenterNotesFontSize,
  showPresenterCursor,
  subscribeStorage,
  wakeLockEnabled,
} from '../state/storage'
import { patch as patchSharedState } from '../state/shared'
import './Presenter.css'

declare const __DEV__: boolean

/** Subscribe to a state/storage value (they share one listener set). */
function useStorageValue<T>(read: () => T): T {
  return useSyncExternalStore(subscribeStorage, read, read)
}

function useWindowFocus(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('focus', cb)
      window.addEventListener('blur', cb)
      return () => {
        window.removeEventListener('focus', cb)
        window.removeEventListener('blur', cb)
      }
    },
    () => document.hasFocus(),
    () => true,
  )
}

export default function PresenterPage() {
  const {
    clicksContext,
    currentSlideNo,
    currentSlideRoute,
    hasNext,
    nextRoute,
    next,
    prev,
    nextSlide,
    prevSlide,
    go, goFirst, goLast,
    getPrimaryClicks,
    isPrintMode,
  } = useNav()
  const { isDrawing } = useDrawings()

  const mainRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  useSwipeControls(mainRef)
  const keepAwake = useStorageValue(() => wakeLockEnabled.value)
  useWakeLock(__SLIDEV_FEATURE_WAKE_LOCK__ && keepAwake)
  const onContextMenu = useContextMenu()
  const { show: editorShown } = useShowEditor()
  const [notesEditing, setNotesEditing] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Presenter - ${slidesTitle} - Slidev`
    return () => { document.title = previousTitle }
  }, [])

  const inFocus = useWindowFocus()
  const layout = useStorageValue(() => presenterLayout.value)
  const notesFontSize = useStorageValue(() => presenterNotesFontSize.value)
  const resize = usePresenterResize(layout, gridRef, mainRef, noteRef, bottomRef)

  const [mainSlideMode, setMainSlideMode] = useState<'slides' | 'mirror'>(
    () => localStorage.getItem('slidev-presenter-main-slide-mode') === 'mirror' ? 'mirror' : 'slides',
  )
  useEffect(() => {
    localStorage.setItem('slidev-presenter-main-slide-mode', mainSlideMode)
  }, [mainSlideMode])

  // Standard shortcuts (same wiring as Play)
  const isPrintModeRef = useRef(isPrintMode)
  isPrintModeRef.current = isPrintMode
  useEffect(() => {
    return registerShortcuts({ isPrintMode: () => isPrintModeRef.current })
  }, [])
  useEffect(() => {
    return useShortcutNav({ next, prev, nextSlide, prevSlide, go, goFirst, goLast })
  }, [next, prev, nextSlide, prevSlide, go, goFirst, goLast])

  // Next frame = next click step, or next slide at clicks 0
  const clicks = clicksContext.current
  const clicksTotal = clicksContext.total
  const requestedNextFrame = useMemo(() => {
    if (clicks < clicksTotal)
      return { route: currentSlideRoute, clicks: clicks + 1 }
    if (hasNext)
      return { route: nextRoute, clicks: 0 }
    return null
  }, [clicks, clicksTotal, currentSlideRoute, hasNext, nextRoute])
  const nextFrame = useLoadedSlide(requestedNextFrame)

  // Preview clicks contexts, cached per slide (Vue: clicksCtxMap)
  const previewCtxMapRef = useRef(new Map<number, { context: ClicksContext, clicksRef: { current: number } }>())
  const nextFrameClicksCtx = useMemo(() => {
    if (!nextFrame?.route)
      return null
    const no = nextFrame.route.no
    let entry = previewCtxMapRef.current.get(no)
    if (!entry) {
      const clicksRef = { current: 0 }
      const meta = nextFrame.route.meta as { clicks?: number, slide?: { frontmatter?: { clicksStart?: number } } } | undefined
      entry = {
        clicksRef,
        context: createClicksContextBase(
          () => clicksRef.current,
          (v: number) => { clicksRef.current = v },
          meta?.slide?.frontmatter?.clicksStart ?? 0,
          meta?.clicks,
        ),
      }
      previewCtxMapRef.current.set(no, entry)
    }
    entry.clicksRef.current = nextFrame.clicks
    return entry.context
  }, [nextFrame])

  // Sync presenter cursor position to the shared state (mirrors the
  // useMouse/watch block in presenter.vue). Must go through patch() -
  // property assignment on the sharedState wrapper does not broadcast.
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const slidesContainer = mainRef.current?.querySelector('#slide-content')
      if (!document.hasFocus() || isDrawing || !showPresenterCursor.value || !slidesContainer) {
        patchSharedState('cursor', undefined)
        return
      }
      const rect = slidesContainer.getBoundingClientRect()
      const x = ((e.pageX - rect.left) / rect.width) * 100
      const y = ((e.pageY - rect.top) / rect.height) * 100
      patchSharedState('cursor', (x < 0 || x > 100 || y < 0 || y > 100) ? undefined : { x, y })
    }
    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      patchSharedState('cursor', undefined)
    }
  }, [isDrawing])

  return (
    <>
      <div className="bg-main h-full slidev-presenter grid grid-rows-[max-content_1fr] of-hidden">
        <div>
          <CurrentProgressBar />
          <TimerBar />
        </div>
        <div ref={gridRef} className={`grid-container layout${layout}`} style={resize.style}>
          {!resize.stacked && (resize.notesOnRight || layout === 3) && (
            <div className={resize.notesOnRight ? 'notes-vertical-resizer' : 'notes-vertical-resizer-left'} role="separator" aria-orientation="vertical" title="Resize notes panel" onPointerDown={resize.startWidth} />
          )}
          {/* Current slide */}
          <div ref={mainRef} className="relative grid-section main bg-main flex flex-col">
            <div className="flex gap-4 items-center border-b border-main p-1">
              <span className="op50 px-2">Current</span>
              <div className="flex-auto" />
              <SegmentControl
                value={mainSlideMode}
                onChange={setMainSlideMode}
                options={[
                  { label: 'Slides', value: 'slides' },
                  { label: 'Screen Mirror', value: 'mirror' },
                ]}
              />
            </div>
            {mainSlideMode === 'mirror' && <ScreenCaptureMirror />}
            {/* Vue uses v-show to keep inferring the clicks context */}
            <div className="p-2 lg:p-4 flex-auto min-h-0" style={{ display: mainSlideMode === 'slides' ? undefined : 'none' }}>
              <SlideContainer isMain onContextMenu={onContextMenu}>
                <Suspense fallback={null}>
                  <SlidesShow renderContext="presenter" />
                </Suspense>
              </SlideContainer>
            </div>
            <div className="w-full pb-2 px-4 flex-none">
              <ClicksSlider
                key={currentSlideRoute?.no}
                clicksContext={getPrimaryClicks(currentSlideRoute)}
              />
            </div>
          </div>

          {/* Next slide preview */}
          <div className="relative grid-section next bg-main flex flex-col p-2 lg:p-4">
            {!resize.stacked && layout === 2 && (
              <div className="notes-row-resizer" style={{ top: -6 }} role="separator" aria-orientation="horizontal" title="Resize notes panel height" onPointerDown={resize.startRow} />
            )}
            {requestedNextFrame ? (
              <SlideContainer>
                <Suspense fallback={null}>
                  {nextFrame && nextFrameClicksCtx && (
                    <SlideWrapper
                      key={nextFrame.route.no}
                      route={nextFrame.route}
                      clicksContext={nextFrameClicksCtx}
                      clicks={nextFrame.clicks}
                      renderContext="previewNext"
                    />
                  )}
                </Suspense>
              </SlideContainer>
            ) : (
              <div className="h-full flex justify-center items-center">
                <div className="text-gray-500">End of the presentation</div>
              </div>
            )}
            <div className="absolute left-0 top-0 bg-main border-b border-r border-main px-2 py-1 op50 text-sm">
              Next
            </div>
          </div>

          {/* Notes (NoteEditable: double-click to edit) */}
          <div ref={noteRef} className="relative grid-section note bg-main">
            {!resize.stacked && !resize.notesOnRight && layout !== 3 && (
              <div className="notes-resizer" style={{ right: -6 }} role="separator" aria-orientation="vertical" title="Resize notes panel" onPointerDown={resize.startWidth} />
            )}
            {!resize.stacked && layout !== 2 && (
              <div className="notes-row-resizer" style={resize.notesOnBottom ? { top: -6 } : { bottom: -6 }} role="separator" aria-orientation="horizontal" title="Resize notes panel height" onPointerDown={resize.startRow} />
            )}
            {__DEV__ && __SLIDEV_FEATURE_EDITOR__ && editorShown ? (
              <SideEditor slideNo={currentSlideNo} embedded />
            ) : (
              <div className="h-full grid grid-rows-[1fr_min-content] overflow-hidden">
                <div className="overflow-auto" style={{ fontSize: `${notesFontSize}em` }}>
                  {__DEV__ ? (
                    <NoteEditable
                      key={`edit-${currentSlideNo}`}
                      no={currentSlideNo}
                      className="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
                      clicksContext={clicksContext}
                      editing={notesEditing}
                      onEditingChange={setNotesEditing}
                    />
                  ) : (
                    <NoteStatic
                      no={currentSlideNo}
                      className="w-full max-w-full h-full overflow-auto p-2 lg:p-4"
                      clicksContext={clicksContext}
                    />
                  )}
                </div>
                <div className={`border-t border-main py-1 px-2 text-sm transition ${inFocus ? '' : 'op25'}`}>
                  <IconButton title="Increase font size" onClick={increasePresenterFontSize}>
                    <div className="i-carbon:zoom-in" />
                  </IconButton>
                  <IconButton title="Decrease font size" onClick={decreasePresenterFontSize}>
                    <div className="i-carbon:zoom-out" />
                  </IconButton>
                  {__DEV__ && (
                    <IconButton title="Edit Notes" onClick={() => setNotesEditing(value => !value)}>
                      <div className="i-carbon:edit" />
                    </IconButton>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div ref={bottomRef} className="grid-section bottom bg-main flex">
            <div className={`transition ${inFocus ? '' : 'op25'}`}>
              <NavControls persist />
            </div>
            <div className="flex-auto" />
            <TimerInlined />
          </div>

          <DrawingControls />
        </div>
      </div>
      <Goto />
      <QuickOverview />
      <ContextMenu />
    </>
  )
}
