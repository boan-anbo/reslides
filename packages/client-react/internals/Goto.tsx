/**
 * Goto dialog component for React
 * Port of Vue client internals/Goto.vue
 */

import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useNav } from '../hooks/useNav'
import { showGotoDialog, subscribeStorage } from '../state/storage'
import { titleText } from '../logic/titles'
import './Goto.css'

export function setShowGotoDialog(value: boolean) { showGotoDialog.value = value }
export function getShowGotoDialog() { return showGotoDialog.value }
export function useGotoDialog() {
  const show = useSyncExternalStore(subscribeStorage, getShowGotoDialog, () => false)
  return { show, setShow: setShowGotoDialog }
}

function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function Goto() {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLLIElement | null)[]>([])

  const [text, setText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { show, setShow } = useGotoDialog()
  const { go, slides } = useNav()

  const fuse = useMemo(() => new Fuse(
    slides.map(s => s.meta?.slide).filter(notNull),
    {
      keys: ['no', 'title'],
      threshold: 0.3,
      shouldSort: true,
      minMatchCharLength: 1,
    },
  ), [slides])

  const path = text.startsWith('/') ? text.substring(1) : text
  const result = useMemo(() => {
    const items = slides.map(route => route.meta?.slide).filter(notNull)
    if (!path.trim()) return []
    const exact = items.find(item => String(item.no) === path)
    return exact ? [exact] : fuse.search(path).map(result => result.item)
  }, [fuse, path, slides])
  const valid = result.length > 0

  const close = useCallback(() => {
    setText('')
    setShow(false)
  }, [setShow])

  const goTo = useCallback(() => {
    const item = result[selectedIndex] ?? result[0]
    if (item) void go(item.no)
    close()
  }, [result, selectedIndex, go, close])

  const scroll = useCallback(() => {
    const item = itemsRef.current[selectedIndex]
    const list = listRef.current
    if (item && list) {
      if (item.offsetTop + item.offsetHeight > list.offsetHeight + list.scrollTop) {
        list.scrollTo({
          behavior: 'smooth',
          top: item.offsetTop + item.offsetHeight - list.offsetHeight + 1,
        })
      }
      else if (item.offsetTop < list.scrollTop) {
        list.scrollTo({
          behavior: 'smooth',
          top: item.offsetTop,
        })
      }
    }
  }, [selectedIndex])

  const focusDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    setSelectedIndex(prev => {
      const next = prev + 1
      return next >= result.length ? 0 : next
    })
  }, [result.length])

  const focusUp = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    setSelectedIndex(prev => {
      const next = prev - 1
      return next < 0 ? Math.max(0, result.length - 1) : next
    })
  }, [result.length])

  useEffect(() => {
    scroll()
  }, [selectedIndex, scroll])

  useEffect(() => {
    if (show) {
      setText('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
    else {
      inputRef.current?.blur()
    }
  }, [show])

  // Close on click outside
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [close])

  const handleSelect = useCallback((no: number) => {
    void go(no)
    close()
  }, [go, close])

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Go to slide"
      id="slidev-goto-dialog"
      ref={containerRef}
      className="fixed top-5 right-5 z-modal w-90 max-w-[calc(100vw-2.5rem)]"
    >
      <div className="bg-main transform shadow px-4 py-2 border border-transparent rounded dark:border-main">
        <input
          id="slidev-goto-input"
          ref={inputRef}
          type="text"
          value={text}
          disabled={!show}
          className={`outline-none bg-transparent ${!valid && text ? 'text-red-400' : ''}`}
          placeholder="Goto..."
          onChange={e => {
            setSelectedIndex(0)
            setText(e.target.value)
          }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') goTo()
            else if (e.key === 'Escape') close()
            else if (e.key === 'ArrowDown') focusDown(e)
            else if (e.key === 'ArrowUp') focusUp(e)
          }}
        />
      </div>
      {result.length > 0 && (
        <div
          ref={listRef}
          className="autocomplete-list shadow border border-transparent rounded dark:border-main"
        >
          <ul className="table w-full border-collapse">
            {result.map((item, index) => (
              <li
                key={item.id}
                ref={el => { itemsRef.current[index] = el }}
                role="button"
                tabIndex={0}
                className={`cursor-pointer hover:opacity-100 table-row items-center ${
                  index !== 0 ? 'border-t border-main' : ''
                } ${selectedIndex === index ? 'bg-active opacity-100' : 'opacity-80'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleSelect(item.no)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleSelect(item.no) }
                  else if (e.key === 'Escape') { e.stopPropagation(); close() }
                }}
              >
                <div className="text-right opacity-50 text-sm table-cell py-2 pl-4 pr-3 align-middle">
                  {item.no}
                </div>
                <div className="table-cell py-2 pr-4 w-full">
                  {titleText(item.title, `Slide ${item.no}`)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
