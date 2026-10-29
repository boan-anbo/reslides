/**
 * IME (Input Method Editor) handling hook for React
 * Port of Vue client composables/useIME.ts
 *
 * Handles composition events for proper CJK input support.
 */

import { useCallback, useEffect, useState } from 'react'

export interface UseIMEResult {
  composingContent: string
  onInput: (e: React.FormEvent<HTMLTextAreaElement>) => void
  onCompositionEnd: () => void
}

export function useIME(
  content: string,
  setContent: (value: string) => void,
): UseIMEResult {
  const [composingContent, setComposingContent] = useState(content)

  // Sync when content changes externally
  useEffect(() => {
    if (content !== composingContent) {
      setComposingContent(content)
    }
  }, [content])

  const onInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const nativeEvent = e.nativeEvent as InputEvent

    if (nativeEvent.isComposing) {
      setComposingContent(target.value)
    } else {
      setContent(target.value)
    }
  }, [setContent])

  const onCompositionEnd = useCallback(() => {
    setContent(composingContent)
  }, [composingContent, setContent])

  return { composingContent, onInput, onCompositionEnd }
}
