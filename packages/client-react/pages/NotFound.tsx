import { Link } from 'react-router-dom'

/**
 * 404 Not Found page
 * Ported from packages/client/pages/404.vue
 */
export default function NotFoundPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link
        to="/1"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
      >
        Go to first slide
      </Link>
    </div>
  )
}
