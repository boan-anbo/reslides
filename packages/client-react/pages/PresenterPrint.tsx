/**
 * Presenter Print Page for React
 * Port of Vue client pages/presenter/print.vue
 */

import { useEffect, useMemo } from 'react'
import { useNav } from '../composables/useNav'
import { configs } from '../env'
import { NoteDisplay } from '../internals/NoteDisplay'
import './PresenterPrint.css'

export function PresenterPrint() {
  const { slides, total } = useNav()

  // Set document title
  useEffect(() => {
    document.title = `Notes - ${configs.title}`
  }, [])

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
@page {
  size: A4;
  margin-top: 1.5cm;
  margin-bottom: 1cm;
}
* {
  -webkit-print-color-adjust: exact;
}
html,
html body,
html #app,
html #page-root {
  height: auto;
  overflow: auto !important;
}
`
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const slidesWithNote = useMemo(() => {
    return slides.value
      .map(route => route.meta?.slide)
      .filter(slide => slide !== undefined && slide.noteHTML !== '')
  }, [slides.value])

  return (
    <div id="page-root">
      <div className="m-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mt-2">
            {configs.title}
          </h1>
          <div className="opacity-50">
            {new Date().toLocaleString()}
          </div>
        </div>

        {slidesWithNote.map((slide, index) => (
          <div key={index} className="flex flex-col gap-4 break-inside-avoid-page">
            <div>
              <h2 className="text-lg">
                <div className="font-bold flex gap-2">
                  <div className="opacity-50">
                    {slide?.no}/{total.value}
                  </div>
                  {slide?.title}
                  <div className="flex-auto" />
                </div>
              </h2>
              <NoteDisplay
                noteHtml={slide!.noteHTML}
                className="max-w-full"
              />
            </div>
            {index < slidesWithNote.length - 1 && (
              <hr className="border-main mb-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PresenterPrint
