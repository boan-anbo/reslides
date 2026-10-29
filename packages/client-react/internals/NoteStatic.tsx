/**
 * NoteStatic component for React
 * Port of Vue client internals/NoteStatic.vue
 */

import type { ClicksContext } from '@slidev/types'
import { useSlideInfo } from '../hooks/useSlideInfo'
import { NoteDisplay } from './NoteDisplay'

export interface NoteStaticProps {
  no: number
  className?: string
  clicksContext?: ClicksContext
}

export function NoteStatic({
  no,
  className,
  clicksContext,
}: NoteStaticProps) {
  const { info } = useSlideInfo(no)

  return (
    <NoteDisplay
      className={className}
      note={info?.note}
      noteHtml={info?.noteHTML}
      clicksContext={clicksContext}
    />
  )
}
