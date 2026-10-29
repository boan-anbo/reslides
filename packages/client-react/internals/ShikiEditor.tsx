/**
 * ShikiEditor component for React
 * Port of Vue client internals/ShikiEditor.vue
 *
 * Code editor with Shiki syntax highlighting.
 */

import { useCallback, useState } from 'react'

export interface ShikiEditorProps {
  value: string
  language?: string
  onChange?: (value: string) => void
  readonly?: boolean
}

export function ShikiEditor({
  value,
  language = 'typescript',
  onChange,
  readonly = false,
}: ShikiEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  return (
    <div className="shiki-editor relative w-full h-full font-mono text-sm">
      <textarea
        value={localValue}
        onChange={handleChange}
        readOnly={readonly}
        className="w-full h-full p-4 bg-gray-900 text-gray-100 resize-none outline-none"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  )
}
