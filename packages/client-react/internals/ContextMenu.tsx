/**
 * ContextMenu component for React
 * Port of Vue client internals/ContextMenu.vue
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { configs } from '../env'
import { useDynamicSlideInfo } from '../hooks/useSlideInfo'
import './ContextMenu.css'

import { closeContextMenu, useContextMenuState } from '../logic/contextMenu'
export { closeContextMenu, openContextMenu, useContextMenuState } from '../logic/contextMenu'
export type { ContextMenuItem, ContextMenuState } from '../logic/contextMenu'

export function ContextMenu() {
  const containerRef = useRef<HTMLDivElement>(null)
  const menu = useContextMenuState()
  const [bounds, setBounds] = useState({ width: 0, height: 0 })
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  const isExplicitEnabled = configs.contextMenu != null

  const { update } = useDynamicSlideInfo(1)

  const disableContextMenu = useCallback(async () => {
    await update({
      frontmatter: {
        contextMenu: false,
      },
    })
  }, [update])

  // Update bounds when menu opens
  useEffect(() => {
    if (containerRef.current && menu) {
      const rect = containerRef.current.getBoundingClientRect()
      setBounds({ width: rect.width, height: rect.height })
    }
  }, [menu])

  // Window resize handling
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Right-click closes
  useEffect(() => {
    const handleMousedown = (e: MouseEvent) => {
      if (e.buttons & 2) {
        closeContextMenu()
      }
    }
    document.addEventListener('mousedown', handleMousedown, { capture: true })
    return () => document.removeEventListener('mousedown', handleMousedown, { capture: true })
  }, [])

  // Window blur closes
  useEffect(() => {
    const handleBlur = () => closeContextMenu()
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  if (!menu) return null

  // Position calculation
  let left = menu.x
  let top = menu.y

  if (menu.x + bounds.width > windowSize.width) {
    left = windowSize.width - bounds.width
  }
  if (menu.y + bounds.height > windowSize.height) {
    top = windowSize.height - bounds.height
  }

  return (
    <div
      ref={containerRef}
      role="menu"
      className="slidev-glass-effect fixed z-context-menu w-60 flex flex-wrap justify-items-start p-1 animate-fade-in rounded-md shadow overflow-hidden select-none"
      style={{ left: `${left}px`, top: `${top}px` }}
      onContextMenu={e => e.preventDefault()}
      onClick={closeContextMenu}
    >
      {menu.items.map((item, index) => {
        if (item === 'separator') {
          return <div key={index} className="w-full my-1 border-t border-main" />
        }

        if (item.show === false) return null

        if (item.small) {
          return (
            <div
              key={index}
              className={`p-2 w-10 h-10 inline-block text-center cursor-pointer rounded flex ${
                item.disabled ? 'opacity-40' : 'hover:bg-active'
              }`}
              title={typeof item.label === 'string' ? item.label : ''}
              onClick={item.disabled ? undefined : item.action}
              aria-disabled={item.disabled}
              role="menuitem"
            >
              {typeof item.icon === 'string' ? (
                <div className={`${item.icon} text-1.2em m-auto`} />
              ) : (
                item.icon
              )}
            </div>
          )
        }

        return (
          <div
            key={index}
            className={`w-full grid grid-cols-[35px_1fr] p-2 pl-0 cursor-pointer rounded ${
              item.disabled ? 'opacity-40' : 'hover:bg-active'
            }`}
            onClick={item.disabled ? undefined : item.action}
              aria-disabled={item.disabled}
              role="menuitem"
          >
            <div className="mx-auto flex">
              {typeof item.icon === 'string' ? (
                <div className={`${item.icon} text-1.2em m-auto`} />
              ) : (
                item.icon
              )}
            </div>
            <div>{item.label}</div>
          </div>
        )
      })}

      {!isExplicitEnabled && (
        <>
          <div className="w-full my-1 border-t border-main" />
          <div className="w-full text-xs p-2">
            <div className="text-main opacity-50">
              Hold <kbd className="border px-1 py-0.5 border-main rounded text-primary">Shift</kbd> and right click to open the native context menu
              {__DEV__ && (
                <button
                  className="underline opacity-50 hover:opacity-100 mt-1 block"
                  onClick={disableContextMenu}
                >
                  Disable custom context menu
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
