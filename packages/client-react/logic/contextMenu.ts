/** The single React context-menu store, shared by Play and Presenter. */
import type { ContextMenuItem as SharedContextMenuItem } from '@slidev/types'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useCallback, useSyncExternalStore } from 'react'
import { configs, mode } from '../env'
import { useNav } from '../hooks/useNav'
import { useContextMenuItems } from '../setup/context-menu'

type SharedOption = Exclude<SharedContextMenuItem, 'separator'>
export type ContextMenuItem = 'separator' | (Omit<SharedOption, 'label' | 'icon'> & { label: ReactNode, icon?: ReactNode })
export interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}
let menu: ContextMenuState | null = null
const listeners = new Set<() => void>()
export function subscribeContextMenu(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function openContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  menu = { x, y, items }
  listeners.forEach(fn => fn())
}
export function closeContextMenu() {
  menu = null
  listeners.forEach(fn => fn())
}
export function useContextMenuState() {
  return useSyncExternalStore(subscribeContextMenu, () => menu, () => null)
}
export function useContextMenu() {
  const { isEmbedded } = useNav()
  const items = useContextMenuItems()
  return useCallback((event: ReactMouseEvent) => {
    if (configs.contextMenu !== true && configs.contextMenu != null && configs.contextMenu !== mode)
      return
    if (isEmbedded || event.shiftKey || event.defaultPrevented)
      return
    openContextMenu(event.clientX, event.clientY, items)
    event.preventDefault()
    event.stopPropagation()
  }, [isEmbedded, items])
}
