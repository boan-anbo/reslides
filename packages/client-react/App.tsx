import { useEffect, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { SlideContextProvider, SlidevContextContext } from './context'
import { configs, getThemeVars } from './env'
import { initializeSharedState, useRootSetup } from './setup/root'
import { useNav, useNavSync } from './hooks/useNav'

/**
 * Root App component for React Slidev client
 * Ported from packages/client/App.vue
 */
export default function App() {
  useRootSetup()
  // Initialize shared state for cross-window sync
  useEffect(() => {
    initializeSharedState()
  }, [])

  // Apply theme vars to document body
  useEffect(() => {
    const themeVars = getThemeVars()
    for (const [key, value] of Object.entries(themeVars)) {
      document.body.style.setProperty(key, String(value))
    }
  }, [])

  // Get nav for SlidevContext
  // Include configs and themeConfigs for theme parity (matches Vue $slidev shape)
  const nav = useNav()
  useNavSync(nav)
  const slidevContext = useMemo(() => ({
    nav,
    configs,
    themeConfigs: configs.themeConfig || {},
  }), [nav])

  return (
    <SlidevContextContext.Provider value={slidevContext}>
      <SlideContextProvider>
        <Outlet />
      </SlideContextProvider>
    </SlidevContextContext.Provider>
  )
}
