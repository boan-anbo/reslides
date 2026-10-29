/** Default menu actions read the same hooks/state as the navigation toolbar. */
import setups from '#slidev/setups/context-menu'
import type { ContextMenuItem } from '../logic/contextMenu'
import { useDrawings } from '../hooks/useDrawings'
import { useNav } from '../hooks/useNav'
import { toggleOverview } from '../internals/QuickOverview'
import { useShowEditor } from '../internals/SideEditor'
import { toggleFullscreen } from '../state/shortcuts'

// @unocss-include
export function useContextMenuItems(): ContextMenuItem[] {
  const nav = useNav()
  const { drawingEnabled, setDrawingEnabled } = useDrawings()
  const { show, setShow } = useShowEditor()
  const items: ContextMenuItem[] = [
    { small: true, icon: 'i-carbon:arrow-left', label: 'Previous Click', action: nav.prev, disabled: !nav.hasPrev },
    { small: true, icon: 'i-carbon:arrow-right', label: 'Next Click', action: nav.next, disabled: !nav.hasNext },
    { small: true, icon: 'i-carbon:arrow-up', label: 'Previous Slide', action: nav.prevSlide, disabled: nav.currentSlideNo <= 1 },
    { small: true, icon: 'i-carbon:arrow-down', label: 'Next Slide', action: nav.nextSlide, disabled: nav.currentSlideNo >= nav.total },
    'separator',
    { show: __DEV__ && __SLIDEV_FEATURE_EDITOR__, icon: 'i-carbon:text-annotation-toggle', label: show ? 'Hide editor' : 'Show editor', action: () => setShow(!show) },
    { show: __SLIDEV_FEATURE_DRAWINGS__, icon: 'i-carbon:pen', label: drawingEnabled ? 'Hide drawing toolbar' : 'Show drawing toolbar', action: () => setDrawingEnabled(!drawingEnabled) },
    { icon: 'i-carbon:apps', label: 'Show slide overview', action: toggleOverview },
    { show: nav.isPresenter, icon: 'i-carbon:presentation-file', label: 'Exit Presenter Mode', action: nav.exitPresenter },
    { show: __SLIDEV_FEATURE_PRESENTER__ && nav.isPresenterAvailable, icon: 'i-carbon:user-speaker', label: 'Enter Presenter Mode', action: nav.enterPresenter },
    { show: !nav.isEmbedded, icon: document.fullscreenElement ? 'i-carbon:minimize' : 'i-carbon:maximize', label: document.fullscreenElement ? 'Close fullscreen' : 'Enter fullscreen', action: () => { void toggleFullscreen() } },
  ]
  return setups.reduce((current, setup) => setup(current), items)
}
