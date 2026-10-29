import type { NavOperations } from '@slidev/types'
import type { ShortcutOptions } from '../setups'
import setups from '#slidev/setups/shortcuts'
import { getDrawingEnabled, setDrawingEnabled } from '../hooks/useDrawings'
import { toggleDark } from '../logic/dark'
import { activeDragElement, showGotoDialog, showOverview, toggleOverview } from '../state/storage'
import { toggleFullscreen } from '../state/shortcuts'
import { downloadPDF } from '../utils'

const dispatch = (name: string, detail?: number) => { window.dispatchEvent(new CustomEvent(`slidev:${name}`, { detail })) }
export default function setupShortcuts(): ShortcutOptions[] {
  const context: NavOperations = {
    next: () => dispatch('next'), prev: async () => dispatch('prev'),
    nextSlide: () => dispatch('nextSlide'), prevSlide: async () => dispatch('prevSlide'),
    go: page => dispatch('go', page), goFirst: () => dispatch('goFirst'), goLast: () => dispatch('goLast'),
    downloadPDF, toggleDark, toggleOverview,
    toggleDrawing: () => setDrawingEnabled(!getDrawingEnabled()),
    escapeOverview: () => { showOverview.value = false },
    showGotoDialog: () => { showGotoDialog.value = !showGotoDialog.value },
  }
  const key = (name: string, shift = false, arrow = false) => (event: KeyboardEvent) => event.key === name && event.shiftKey === shift && (!arrow || !activeDragElement.value)
  const shortcuts: ShortcutOptions[] = [
    { name: 'next_space', key: key(' '), fn: context.next, autoRepeat: true },
    { name: 'prev_space', key: key(' ', true), fn: context.prev, autoRepeat: true },
    { name: 'next_right', key: key('ArrowRight', false, true), fn: context.next, autoRepeat: true },
    { name: 'prev_left', key: key('ArrowLeft', false, true), fn: context.prev, autoRepeat: true },
    { name: 'next_page_key', key: 'pageDown', fn: context.next, autoRepeat: true },
    { name: 'prev_page_key', key: 'pageUp', fn: context.prev, autoRepeat: true },
    { name: 'next_down', key: key('ArrowDown', false, true), fn: context.nextSlide, autoRepeat: true },
    { name: 'prev_up', key: key('ArrowUp', false, true), fn: context.prevSlide, autoRepeat: true },
    { name: 'next_shift', key: key('ArrowRight', true), fn: context.nextSlide, autoRepeat: true },
    { name: 'prev_shift', key: key('ArrowLeft', true), fn: context.prevSlide, autoRepeat: true },
    { name: 'toggle_dark', key: e => e.key === 'd' && !activeDragElement.value && !getDrawingEnabled(), fn: toggleDark },
    { name: 'toggle_overview', key: e => ['o', '`'].includes(e.key) && !getDrawingEnabled(), fn: toggleOverview },
    { name: 'goto', key: e => e.key === 'g' && !getDrawingEnabled(), fn: context.showGotoDialog },
    { name: 'fullscreen', key: 'f', fn: toggleFullscreen },
  ]
  return setups.reduce((current, setup) => setup(context, current), shortcuts)
}
