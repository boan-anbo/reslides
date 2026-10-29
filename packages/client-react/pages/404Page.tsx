/**
 * 404 Page for React
 * Port of Vue client pages/404.vue
 */

import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useNav } from '../composables/useNav'
import './404Page.css'

export function NotFoundPage() {
  const location = useLocation()
  const { total } = useNav()

  const guessedSlide = useMemo(() => {
    const path = location.pathname
    const match = path.match(/\d+/)
    if (match) {
      const slideNo = +match[0]
      if (slideNo > 0 && slideNo <= total.value)
        return slideNo
    }
    return null
  }, [location.pathname, total.value])

  return (
    <div className="grid justify-center text-center pt-15% gap-5">
      <div>
        <h1 className="text-9xl font-light">
          404
        </h1>
        <p className="text-2xl">
          Page <code className="op-60">{location.pathname}</code> not found
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-2 max-w-xs mx-auto w-full">
        {guessedSlide !== 1 && (
          <Link to="/" className="page-link">
            Go Home
          </Link>
        )}
        {guessedSlide && (
          <Link to={`/${guessedSlide}`} className="page-link">
            Go to Slide {guessedSlide}
          </Link>
        )}
      </div>
    </div>
  )
}

export default NotFoundPage
