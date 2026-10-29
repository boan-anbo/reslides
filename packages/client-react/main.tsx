import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import setupMain from './setup/main'

// Import styles
import '#slidev/styles'

/**
 * Main entry point for React Slidev client
 * Ported from packages/client/main.ts
 */
async function main() {
  // Mount app
  const container = document.getElementById('app')
  if (!container) {
    throw new Error('Root element #app not found')
  }

  const root = createRoot(container)
  const { router } = await setupMain(root)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}

main().catch(error => {
  console.error('[Slidev] Failed to start React client', error)
  const container = document.getElementById('app')
  if (container) container.textContent = `Slidev failed to start: ${error instanceof Error ? error.message : String(error)}`
})
