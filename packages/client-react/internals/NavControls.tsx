/**
 * NavControls component for React
 * Port of Vue client internals/NavControls.vue
 *
 * Main navigation controls bar.
 */

import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useDrawings } from '../hooks/useDrawings'
import { useDarkMode } from '../hooks/useDarkMode'
import { useNav } from '../hooks/useNav'
import { configs } from '../env'
import { isColorSchemaConfigured } from '../logic/dark'
import { presenterLayout, showPresenterCursor, subscribeStorage, togglePresenterLayout } from '../state/storage'
import { setShowInfoDialog } from './Controls'
import { IconButton } from './IconButton'
import { MenuButton } from './MenuButton'
import { RecordingControls } from './RecordingControls'
import { Settings } from './Settings'
import { useShowEditor } from './SideEditor'
import { SyncControls } from './SyncControls'
import { VerticalDivider } from './VerticalDivider'
import { toggleOverview } from './QuickOverview'

declare const __DEV__: boolean

export interface NavControlsProps {
  persist?: boolean
}

export function NavControls({ persist = false }: NavControlsProps) {
  const {
    currentSlideNo,
    hasNext,
    hasPrev,
    isEmbedded,
    isPresenter,
    isPresenterAvailable,
    next,
    prev,
    total,
    enterPresenter,
    exitPresenter,
  } = useNav()

  const { brush, drawingEnabled, setDrawingEnabled } = useDrawings()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { show: editorShown, setShow: setEditorShown } = useShowEditor()
  const cursorShown = useSyncExternalStore(subscribeStorage, () => showPresenterCursor.value, () => true)
  const currentPresenterLayout = useSyncExternalStore(subscribeStorage, () => presenterLayout.value, () => 1)

  const rootRef = useRef<HTMLDivElement>(null)

  const barStyle = useMemo(() => persist
    ? 'text-$slidev-controls-foreground bg-transparent'
    : 'rounded-md bg-main shadow-xl border border-main',
  [persist])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    }
    else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleMouseLeave = () => {
    if (rootRef.current && document.activeElement && rootRef.current.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur()
    }
  }

  return (
    <nav ref={rootRef} className="flex flex-col" data-testid="nav-controls">
      <div
        className={`flex flex-wrap-reverse text-xl gap-0.5 p-1 lg:p-2 ${barStyle}`}
        onMouseLeave={handleMouseLeave}
      >
        {!isEmbedded && (
          <IconButton
            title={isFullscreen ? 'Close fullscreen' : 'Enter fullscreen'}
            onClick={toggleFullscreen}
          >
            <div className={isFullscreen ? 'i-carbon:minimize' : 'i-carbon:maximize'} />
          </IconButton>
        )}
        <IconButton
          title="Go to previous slide"
          className={hasPrev ? '' : 'disabled opacity-30'}
          onClick={prev}
        >
          <div className="i-carbon:arrow-left" />
        </IconButton>
        <IconButton
          title="Go to next slide"
          className={hasNext ? '' : 'disabled opacity-30'}
          onClick={next}
        >
          <div className="i-carbon:arrow-right" />
        </IconButton>
        {!isEmbedded && (
          <IconButton title="Show slide overview" onClick={toggleOverview}>
            <div className="i-carbon:apps" />
          </IconButton>
        )}
        {!isColorSchemaConfigured.value && (
          <IconButton
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => toggleDark()}
          >
            <div className={isDark ? 'i-carbon:moon' : 'i-carbon:sun'} />
          </IconButton>
        )}

        <VerticalDivider />

        {/* Recording (camera + record buttons) - Vue: RecordingControls */}
        {/* @ts-expect-error - __SLIDEV_FEATURE_RECORD__ is a global */}
        {__SLIDEV_FEATURE_RECORD__ && !isPresenter && !isEmbedded && (
          <>
            <RecordingControls />
            <VerticalDivider />
          </>
        )}

        {/* Presenter cursor toggle (presenter view only) */}
        {isPresenter && !isEmbedded && (
          <IconButton
            title={cursorShown ? 'Hide presenter cursor' : 'Show presenter cursor'}
            onClick={() => { showPresenterCursor.value = !showPresenterCursor.value }}
          >
            <div className={cursorShown ? 'i-ph:cursor-fill' : 'i-ph:cursor-duotone'} />
          </IconButton>
        )}

        {/* @ts-expect-error - __SLIDEV_FEATURE_DRAWINGS__ is a global */}
        {__SLIDEV_FEATURE_DRAWINGS__ && (!configs.drawings.presenterOnly || isPresenter) && !isEmbedded && (
          <>
            <IconButton
              title={drawingEnabled ? 'Hide drawing toolbar' : 'Show drawing toolbar'}
              className="relative"
              onClick={() => setDrawingEnabled(!drawingEnabled)}
            >
              <div className="i-carbon:pen" />
              {drawingEnabled && (
                <div
                  className="absolute left-1 right-1 bottom-0 h-0.7 rounded-full"
                  style={{ background: brush.color }}
                />
              )}
            </IconButton>
            <VerticalDivider />
          </>
        )}

        {!isEmbedded && (
          <>
            {isPresenter && (
              <IconButton title="Play Mode" onClick={exitPresenter}>
                <div className="i-carbon:presentation-file" />
              </IconButton>
            )}
            {/* @ts-expect-error - __SLIDEV_FEATURE_PRESENTER__ is a global */}
            {__SLIDEV_FEATURE_PRESENTER__ && isPresenterAvailable && (
              <IconButton title="Presenter Mode" onClick={enterPresenter}>
                <div className="i-carbon:user-speaker" />
              </IconButton>
            )}
            {/* Side editor toggle (dev only) - Vue: showEditor */}
            {/* @ts-expect-error - __SLIDEV_FEATURE_EDITOR__ is a global */}
            {__DEV__ && __SLIDEV_FEATURE_EDITOR__ && (
              <IconButton
                title={editorShown ? 'Hide editor' : 'Show editor'}
                className="lt-md:hidden"
                onClick={() => setEditorShown(!editorShown)}
              >
                <div className="i-carbon:text-annotation-toggle" />
              </IconButton>
            )}
          </>
        )}

        {/* Browser exporter (PDF) - Vue: to /export */}
        {/* @ts-expect-error - __SLIDEV_FEATURE_BROWSER_EXPORTER__ is a global */}
        {__SLIDEV_FEATURE_BROWSER_EXPORTER__ && !isEmbedded && !isPresenter && (
          <IconButton title="Browser Exporter" to="/export">
            <div className="i-carbon:document-pdf" />
          </IconButton>
        )}

        {/* Info dialog */}
        {!isPresenter && configs.info && !isEmbedded && (
          <IconButton title="Show info" onClick={() => setShowInfoDialog(true)}>
            <div className="i-carbon:information" />
          </IconButton>
        )}

        {!isEmbedded && (
          <>
            <VerticalDivider />

            {/* Presenter layout cycle (presenter view only) */}
            {isPresenter && (
              <IconButton
                title="Toggle Presenter Layout"
                className="aspect-ratio-initial flex items-center"
                onClick={togglePresenterLayout}
              >
                <div className="i-carbon:template" />
                {currentPresenterLayout}
              </IconButton>
            )}

            {/* Presenter/viewer sync direction toggles */}
            {/* @ts-expect-error - __SLIDEV_FEATURE_PRESENTER__ is a global */}
            {__SLIDEV_FEATURE_PRESENTER__ && <SyncControls />}

            <MenuButton
              button={
                <IconButton title="More Options">
                  <div className="i-carbon:settings-adjust" />
                </IconButton>
              }
              menu={<Settings />}
            />
          </>
        )}

        <VerticalDivider />

        <div className="px-2 my-auto">
          <span className="text-lg">{currentSlideNo}</span>
          <span className="opacity-50 text-sm"> / {total}</span>
        </div>
      </div>
    </nav>
  )
}
