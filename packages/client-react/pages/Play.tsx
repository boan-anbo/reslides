/**
 * Play page - main slide presentation view
 * Ported from apps/slidev-source/packages/client/pages/play.vue
 */
import { Suspense, useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { useDrawings } from '../hooks/useDrawings'
import { useHideCursorIdle } from '../hooks/useHideCursorIdle'
import { useNav } from '../hooks/useNav'
import { useSwipeControls } from '../hooks/useSwipeControls'
import { Controls } from '../internals/Controls'
import { NavControls } from '../internals/NavControls'
import { PresenterMouse } from '../internals/PresenterMouse'
import SlideContainer from '../internals/SlideContainer'
import SlidesShow from '../internals/SlidesShow'
import { SideEditor, useShowEditor } from '../internals/SideEditor'
import { registerShortcuts, useShortcutNav } from '../logic/shortcuts'
import { useContextMenu } from '../logic/contextMenu'
import { hideCursorIdle, isScreenVertical, subscribeStorage, wakeLockEnabled } from '../state/storage'
import { useWakeLock } from '../hooks/useWakeLock'

export default function PlayPage() {
  const { next, prev, nextSlide, prevSlide, go, goFirst, goLast, currentSlideNo, isPrintMode, isPlaying, isEmbedded } = useNav()
  const { isDrawing } = useDrawings()
  const { show: editorShown } = useShowEditor()
  const onContextMenu = useContextMenu()

  // Vue: useHideCursorIdle(isPlaying && !isEmbedded && !showEditor)
  const hideIdle = useSyncExternalStore(subscribeStorage, () => hideCursorIdle.value)
  const keepAwake = useSyncExternalStore(subscribeStorage, () => wakeLockEnabled.value)
  useWakeLock(__SLIDEV_FEATURE_WAKE_LOCK__ && keepAwake && isPlaying && !isEmbedded)
  useHideCursorIdle(isPlaying && !isEmbedded && !editorShown && hideIdle)

  const rootRef = useRef<HTMLDivElement>(null)
  useSwipeControls(rootRef)

  // Store isPrintMode in ref for shortcuts callback
  const isPrintModeRef = useRef(isPrintMode)
  isPrintModeRef.current = isPrintMode

  // Register keyboard shortcuts with isPrintMode check
  useEffect(() => {
    const cleanup = registerShortcuts({
      isPrintMode: () => isPrintModeRef.current,
    })
    return cleanup
  }, [])

  // Connect nav functions to shortcut events
  useEffect(() => {
    const cleanup = useShortcutNav({ next, prev, nextSlide, prevSlide, go, goFirst, goLast })
    return cleanup
  }, [next, prev, nextSlide, prevSlide, go, goFirst, goLast])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Only respond to clicks on slide-container itself, not children
    if (e.button === 0 && target?.id === 'slide-container') {
      // Click right half to go next, left half to go previous
      if ((e.pageX / window.innerWidth) > 0.5) {
        next()
      } else {
        prev()
      }
    }
  }, [next, prev])

  // Vue: persistNav = isScreenVertical || showEditor
  const persistNav = isScreenVertical.value || editorShown

  return (
    <>
      <div id="page-root" ref={rootRef} className="grid grid-cols-[1fr_max-content]">
        <SlideContainer
          isMain
          style={{ background: 'var(--slidev-slide-container-background, black)' }}
          onClick={handleClick}
          onContextMenu={onContextMenu}
          controls={!isPrintMode && (
            <div
              className={[
                'absolute bottom-0 left-0 transition duration-300 opacity-0 hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100',
                persistNav ? '!opacity-100 right-0' : 'opacity-0 p-2',
                isDrawing ? 'pointer-events-none' : '',
              ].join(' ')}
            >
              <NavControls persist={persistNav} />
            </div>
          )}
        >
          <Suspense fallback={null}>
            <SlidesShow renderContext="slide" />
          </Suspense>
          <PresenterMouse />
        </SlideContainer>
      </div>
      {/* renders null unless toggled via the NavControls editor button */}
      <SideEditor slideNo={currentSlideNo} />
      {!isPrintMode && <Controls />}
      <div id="twoslash-container" />
    </>
  )
}
