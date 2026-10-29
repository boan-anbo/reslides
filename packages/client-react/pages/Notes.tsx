import type { SlideRoute } from '@slidev/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { slides } from '../env'
import { createClicksContextBase } from '../hooks/useClicks'
import { useSharedState } from '../state/shared'

interface NoteDisplayProps {
  noteHtml?: string
  note?: string
  placeholder?: string
  className?: string
}

/**
 * Simple note display component
 * Renders note content with HTML or plain text fallback
 */
function NoteDisplay({ noteHtml, note, placeholder, className = '' }: NoteDisplayProps) {
  if (noteHtml) {
    return (
      <div
        className={`prose dark:prose-invert overflow-auto outline-none slidev-note ${className}`}
        dangerouslySetInnerHTML={{ __html: noteHtml }}
      />
    )
  }

  if (note) {
    return (
      <div className={`prose dark:prose-invert overflow-auto outline-none slidev-note ${className}`}>
        <p>{note}</p>
      </div>
    )
  }

  return (
    <div className={`prose dark:prose-invert overflow-auto outline-none opacity-50 italic select-none slidev-note ${className}`}>
      <p>{placeholder || 'No notes.'}</p>
    </div>
  )
}

/**
 * Notes page - hands-free live notes viewer
 * Port from packages/client/pages/notes.vue
 *
 * Features:
 * - Displays speaker notes for current slide
 * - Auto-syncs with main presenter view
 * - Font size controls
 * - Fullscreen toggle
 */
export default function NotesPage() {
  // Use sharedState directly for sync (like Vue notes.vue)
  // This allows Notes viewer to sync with presenter without URL-based navigation
  const [sharedState] = useSharedState()

  const total = slides.length
  const currentSlideNo = sharedState.page
  const currentSlideRoute = slides[currentSlideNo - 1]

  // Create clicks context from sharedState (like Vue notes.vue)
  // Notes viewer is read-only, so setter is a no-op
  const clicksContext = useMemo(() => {
    return createClicksContextBase(
      () => sharedState.clicks,
      () => {}, // Read-only, no-op setter
      0,
      sharedState.clicksTotal,
    )
  }, [sharedState.clicks, sharedState.clicksTotal])

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('slidev-notes-font-size')
    return stored ? parseInt(stored, 10) : 18
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Get current slide's note
  const currentNote = useMemo(() => {
    const meta = (currentSlideRoute as SlideRoute & { meta?: { slide?: { note?: string; noteHTML?: string } } })?.meta
    return {
      note: meta?.slide?.note,
      noteHtml: meta?.slide?.noteHTML,
    }
  }, [currentSlideRoute])

  // Auto-scroll to top when slide changes
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
    window.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  }, [currentSlideNo])

  // Persist font size
  useEffect(() => {
    localStorage.setItem('slidev-notes-font-size', fontSize.toString())
  }, [fontSize])

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => prev + 1)
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(8, prev - 1))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div className="h-full flex flex-col bg-[var(--slidev-controls-background)]">
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2 text-xl mb-2">
              <span>ℹ️</span> Help
            </div>
            <div className="prose dark:prose-invert text-sm">
              <p>This is the hands-free live notes viewer.</p>
              <p>It's designed to be used in a separate view or device. The progress is controlled by and auto synced with the main presenter or slide.</p>
            </div>
            <div className="flex mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowHelp(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(currentSlideNo / total) * 100}%` }}
        />
      </div>

      {/* Notes Content */}
      <div
        ref={scrollerRef}
        className="px-5 py-3 flex-auto h-full overflow-auto"
        style={{ fontSize: `${fontSize}px` }}
      >
        <NoteDisplay
          note={currentNote.note}
          noteHtml={currentNote.noteHtml}
          placeholder={`No notes for Slide ${currentSlideNo}.`}
        />
      </div>

      {/* Clicks Slider (simplified) */}
      {clicksContext.total > 0 && (
        <div className="flex-none border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-50">Clicks:</span>
            <span>{clicksContext.current}</span>
            <span className="opacity-50">/ {clicksContext.total}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex-none border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 items-center px-6 py-3">
          <button
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
          <button
            title="Increase font size"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={increaseFontSize}
          >
            🔍+
          </button>
          <button
            title="Decrease font size"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={decreaseFontSize}
          >
            🔍−
          </button>
          <a
            href="/notes-edit"
            target="_blank"
            rel="noopener noreferrer"
            title="Edit notes"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ✏️
          </a>
          <button
            title="Help"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setShowHelp(true)}
          >
            ❓
          </button>
          <div className="flex-auto" />
          <div className="px-2 my-auto">
            <span className="text-lg">{currentSlideNo}</span>
            <span className="opacity-50 text-sm"> / {total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
