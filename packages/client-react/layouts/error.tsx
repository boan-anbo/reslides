/**
 * Error layout for React
 * Port of Vue client layouts/error.vue
 */

declare const __SLIDEV_HAS_SERVER__: boolean

export default function ErrorLayout() {
  const message = typeof __SLIDEV_HAS_SERVER__ !== 'undefined' && __SLIDEV_HAS_SERVER__
    ? 'An error occurred on this slide. Check the terminal for more information.'
    : 'Failed to fetch this slide. Please check your network connection.'

  return (
    <div className="px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono">
      {message}
    </div>
  )
}
