import setups from '#slidev/setups/routes'
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Navigate, redirect, useLocation } from 'react-router-dom'

import { configs } from '../env'

// Lazy load pages
const EntryPage = lazy(() => import('../pages/EntryPage'))
const PlayPage = lazy(() => import('../pages/Play'))
const PresenterPage = lazy(() => import('../pages/Presenter'))
const NotesPage = lazy(() => import('../pages/Notes'))
const NotesEditPage = lazy(() => import('../pages/NotesEdit'))
const OverviewPage = lazy(() => import('../pages/Overview'))
const PrintPage = lazy(() => import('../pages/Print'))
const ExportPage = lazy(() => import('../pages/Export'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))

function SlideRedirect({ to }: { to: string }) {
  const { search } = useLocation()
  return <Navigate to={{ pathname: to, search }} replace />
}

/**
 * Setup routes for React Router
 * Ported from packages/client/setup/routes.ts
 */
export function setupRoutes(): RouteObject[] {
  let routes: RouteObject[] = [{ path: '/entry', element: <Suspense fallback={null}><EntryPage /></Suspense> }]

  const passwordGuard = ({ request, params }: LoaderFunctionArgs) => {
    const password = new URL(request.url).searchParams.get('password')
    if (!configs.remote || password === configs.remote) return null
    if (password === null && window.prompt('Enter password') === configs.remote) {
      const target = new URL(request.url)
      target.searchParams.set('password', configs.remote)
      return redirect(`${target.pathname}${target.search}`)
    }
    const base = __SLIDEV_HASH_ROUTE__ ? '/' : import.meta.env.BASE_URL
    return redirect(`${base}${params.no ?? 1}`)
  }

  // Presenter routes
  if (__SLIDEV_FEATURE_PRESENTER__) {
    routes.push(
      {
        path: '/presenter/:no',
        element: (
          <Suspense fallback={null}>
            <PresenterPage />
          </Suspense>
        ),
      },
      {
        path: '/presenter',
        element: <SlideRedirect to="/presenter/1" />,
      },
    )
  }

  // Notes routes (always available - syncs with presenter/main view)
  routes.push(
    {
      path: '/notes',
      element: (
        <Suspense fallback={null}>
          <NotesPage />
        </Suspense>
      ),
    },
    {
      path: '/notes-edit',
      element: (
        <Suspense fallback={null}>
          <NotesEditPage />
        </Suspense>
      ),
    },
  )

  // Overview route
  routes.push(
    {
      path: '/overview',
      element: (
        <Suspense fallback={null}>
          <OverviewPage />
        </Suspense>
      ),
    },
  )

  // Print and Export routes
  if (__SLIDEV_FEATURE_PRINT__) {
    routes.push(
      {
        path: '/print',
        element: (
          <Suspense fallback={null}>
            <PrintPage />
          </Suspense>
        ),
      },
    )
  }

  // Browser exporter (export with optional slide number)
  if (__SLIDEV_FEATURE_BROWSER_EXPORTER__) {
    routes.push(
      {
        path: '/export/:no?',
        element: (
          <Suspense fallback={null}>
            <ExportPage />
          </Suspense>
        ),
      },
    )
  }

  // Core play route
  routes.push(
    {
      path: '/:no',
      element: <PlayPage />,
    },
    {
      path: '/',
      element: <SlideRedirect to="/1" />,
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  )

  const protectedPaths = new Set(['/entry', '/overview', '/notes', '/notes-edit', '/presenter/:no', '/print', '/export/:no?'])
  routes = routes.map(route => protectedPaths.has(route.path ?? '') ? { ...route, loader: passwordGuard } : route)
  for (const setup of setups) routes = setup(routes)
  return routes
}
