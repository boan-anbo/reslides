/** Editable presenter notes, with the same click-aware display as static notes. */
import type { ClicksContext } from '@slidev/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDynamicSlideInfo } from '../hooks/useSlideInfo'
import { NoteDisplay } from './NoteDisplay'

export interface NoteEditableProps {
  no: number
  className?: string
  clicksContext?: ClicksContext
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export function NoteEditable({ no, className = '', clicksContext, editing, onEditingChange }: NoteEditableProps) {
  const { info, update } = useDynamicSlideInfo(no)
  const [localEditing, setLocalEditing] = useState(false)
  const isEditing = editing ?? localEditing
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cancelled = useRef(false)
  const saving = useRef(false)
  const setEditing = useCallback((value: boolean) => {
    setLocalEditing(value)
    onEditingChange?.(value)
  }, [onEditingChange])

  useEffect(() => {
    if (!isEditing) setEditContent(info?.note ?? '')
  }, [info?.note, isEditing])
  useEffect(() => {
    if (!isEditing) return
    cancelled.current = false
    setError('')
    textareaRef.current?.focus()
  }, [isEditing])

  const save = async () => {
    if (cancelled.current || saving.current) return
    saving.current = true
    try {
      await update({ note: editContent })
      setEditing(false)
      setError('')
    }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save notes')
    }
    finally { saving.current = false }
  }

  if (isEditing) {
    return (
      <div className={`prose dark:prose-invert overflow-auto outline-none slidev-note ${className}`}>
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={event => setEditContent(event.target.value)}
          onBlur={() => { void save() }}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelled.current = true
              setEditContent(info?.note ?? '')
              setEditing(false)
            }
            else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              void save()
            }
          }}
          className="w-full h-full min-h-32 p-2 bg-transparent border border-primary rounded outline-none resize-none"
          placeholder="Write your notes here..."
        />
        {error && <p role="alert">{error}</p>}
      </div>
    )
  }

  return (
    <div className="h-full" onDoubleClick={() => setEditing(true)}>
      <NoteDisplay className={className} note={info?.note} noteHtml={info?.noteHTML} clicksContext={clicksContext} autoScroll placeholder="No notes for this slide" />
    </div>
  )
}
