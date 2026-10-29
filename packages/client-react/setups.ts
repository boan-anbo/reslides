/** React-native setup contracts. Compiler-only setup helpers remain shared. */
import type { Root } from 'react-dom/client'
import type { createBrowserRouter, RouteObject } from 'react-router-dom'
import type { NavOperations } from '@slidev/types'
import type { ContextMenuItem } from './logic/contextMenu'
export type AppContext = { app: Root, router: ReturnType<typeof createBrowserRouter> }
export type AppSetup = (context: AppContext) => void | Promise<void>
export type RootSetup = () => void | (() => void) | Promise<void | (() => void)>
export type RoutesSetup = (routes: RouteObject[]) => RouteObject[]
export interface ShortcutOptions {
  name?: string
  key: string | ((event: KeyboardEvent) => boolean)
  fn?: () => void
  autoRepeat?: boolean
}
export type ShortcutsSetup = (nav: NavOperations, defaults: ShortcutOptions[]) => ShortcutOptions[]
export type ContextMenuSetup = (items: ContextMenuItem[]) => ContextMenuItem[]
export const defineAppSetup = (setup: AppSetup) => setup
export const defineRootSetup = (setup: RootSetup) => setup
export const defineRoutesSetup = (setup: RoutesSetup) => setup
export const defineShortcutsSetup = (setup: ShortcutsSetup) => setup
export const defineContextMenuSetup = (setup: ContextMenuSetup) => setup
export { defineMonacoSetup, defineCodeRunnersSetup, defineShikiSetup, defineMermaidSetup } from '@slidev/types'
