/**
 * SideEditor component for React
 * Port of Vue client internals/SideEditor.vue
 *
 * Side panel editor for slides markdown.
 */

import { useCallback, useEffect, useState } from 'react'
import { useDynamicSlideInfo } from '../hooks/useSlideInfo'
import { IconButton } from './IconButton'

// Global state for editor visibility
let showEditor = false
const editorListeners = new Set<() => void>()

export function setShowEditor(value: boolean) {
  showEditor = value
  editorListeners.forEach(fn => fn())
}

export function useShowEditor() {
  const [show, setShow] = useState(showEditor)

  useEffect(() => {
    const listener = () => setShow(showEditor)
    editorListeners.add(listener)
    return () => { editorListeners.delete(listener) }
  }, [])

  return { show, setShow: setShowEditor }
}

export interface SideEditorProps {
  slideNo: number
  embedded?: boolean
}

export function SideEditor({ slideNo, embedded = false }: SideEditorProps) {
  const { show } = useShowEditor()
  const { info, update } = useDynamicSlideInfo(slideNo)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (info?.content) {
      setContent(info.content)
    }
  }, [info?.content])

  const handleSave = useCallback(async () => {
    await update({ content })
  }, [content, update])

  if (!show) return null

  return (
    <div className={`${embedded ? 'h-full min-h-0' : 'fixed right-0 top-0 bottom-0 w-96 shadow-xl z-50'} bg-main border-l border-main flex flex-col`}>
      <div className="flex items-center justify-between p-2 border-b border-main">
        <span className="font-semibold">Slide {slideNo}</span>
        <div className="flex gap-1">
          <IconButton title="Save" onClick={handleSave}>
            <div className="i-carbon:save" />
          </IconButton>
          <IconButton title="Close" onClick={() => setShowEditor(false)}>
            <div className="i-carbon:close" />
          </IconButton>
        </div>
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        className="flex-1 p-4 bg-transparent resize-none outline-none font-mono text-sm"
        spellCheck={false}
      />
    </div>
  )
}
