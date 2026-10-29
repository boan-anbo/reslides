/**
 * SlideError component - shown when a slide fails to load
 * Used by virtual-react/slides.ts in createLazySlide() error handling
 */

interface SlideErrorProps {
  error: Error | unknown
  slideNo: number
}

export default function SlideError({ error, slideNo }: SlideErrorProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    <div className="slidev-error h-full w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
      <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
        Failed to load slide {slideNo}
      </div>
      <div className="text-red-500 dark:text-red-300 text-sm max-w-md text-center">
        {errorMessage}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  )
}
