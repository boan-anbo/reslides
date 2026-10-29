import type { Root } from 'react-dom/client'
import setups from '#slidev/setups/main'
import { createElement } from 'react'
import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import App from '../App'
import { setupRoutes } from './routes'

export default async function setupMain(app: Root) {
  const setMaxHeight = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)
  import.meta.hot?.dispose(() => window.removeEventListener('resize', setMaxHeight))
  const routes = [{ path: '/', element: createElement(App), children: setupRoutes() }]
  // Hash paths live inside the fragment. The deployment base belongs to the
  // document URL, not the router's internal path.
  const router = __SLIDEV_HASH_ROUTE__ ? createHashRouter(routes) : createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
  for (const setup of setups) await setup({ app, router })
  return { router }
}
