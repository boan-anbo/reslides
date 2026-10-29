import type { SlideRoute } from '@slidev/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNav } from '../hooks/useNav'
import { slides } from '../env'

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean

/**
 * NotesEdit page - batch notes editor
 * Ported from packages/client/pages/notes-edit.vue
 *
 * Allows editing all slide notes at once in a single textarea.
 * Notes are separated by `--- #[slideNo]` lines.
 */
export default function NotesEditPage() {
  const [showHelp, setShowHelp] = useState(false)
  const [note, setNote] = useState(() => serializeNotes(slides))
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Serialize all slide notes into text format
  function serializeNotes(slides: SlideRoute[]): string {
    const lines: string[] = []

    for (const slide of slides) {
      const meta = slide.meta as { slide?: { note?: string } } | undefined
      const slideNote = meta?.slide?.note?.trim()
      if (!slideNote) continue

      lines.push(`--- #${slide.no}`)
      lines.push('')
      lines.push(slideNote)
      lines.push('')
    }

    return lines.join('\n')
  }

  // Deserialize text back to slide notes and update server
  const deserializeNotes = useCallback(async (notes: string) => {
    const lines = notes.split(/^(---\s*#\d+\s*)$/gm)

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const match = line.match(/^---\s*#(\d+)\s*$/)
      if (match) {
        const no = parseInt(match[1], 10)
        const noteContent = lines[index + 1]?.trim() || ''
        const slide = slides.find(s => s.no === no)

        if (slide) {
          // Update local meta
          const meta = slide.meta as { slide?: { note?: string } }
          if (meta?.slide) {
            meta.slide.note = noteContent
          }

          // Update server in dev mode (React API endpoint)
          if (__DEV__) {
            try {
              const res = await fetch(`/__slidev-react/slides/${no}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteContent }),
              })
              // Server returns updated slide info including noteHTML
              if (res.ok) {
                const updated = await res.json()
                // Sync noteHTML to keep presenter/notes viewers consistent
                if (meta?.slide && updated.noteHTML !== undefined) {
                  (meta.slide as { noteHTML?: string }).noteHTML = updated.noteHTML
                }
              }
            } catch (e) {
              // Silently fail - server may not support this endpoint
            }
          }
        }
      }
    }
  }, [])

  // Debounced update
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      deserializeNotes(note)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [note, deserializeNotes])

  return (
    <div className="h-full relative">
      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 max-w-md mx-4 flex flex-col gap-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-2 text-xl">
              <span>ℹ️</span> Help
            </div>
            <div className="prose dark:prose-invert text-sm">
              <p>This is the batch notes editor. You can edit the notes for all the slides at once here.</p>
              <p>
                The note for each slide are separated by <code>--- #[no]</code> lines,
                you might want to keep them while editing.
              </p>
            </div>
            <div className="flex mt-2">
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

      {/* Help Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          title="Help"
          className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          onClick={() => setShowHelp(true)}
        >
          <span className="text-2xl">❓</span>
        </button>
      </div>

      {/* Editor */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        className="prose dark:prose-invert resize-none p-5 outline-none bg-transparent block h-full w-full font-mono text-sm"
        placeholder={`No notes yet.\n\nAdd notes to slides using the format:\n--- #1\n\nYour notes for slide 1 here\n\n--- #2\n\nYour notes for slide 2 here`}
      />
    </div>
  )
}
