/**
 * Route query utilities for React
 * Port of Vue client logic/route.ts
 *
 * Provides React hook for URL query parameter sync.
 */

import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export interface UseRouteQueryOptions {
  mode?: 'replace' | 'push'
}

export function useRouteQuery<T extends string | string[]>(
  name: string,
  defaultValue?: T,
  options: UseRouteQueryOptions = {},
): [T, (value: T) => void] {
  const { mode = 'replace' } = options
  const location = useLocation()
  const navigate = useNavigate()

  const value = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const data = params.getAll(name)

    if (data.length === 0)
      return defaultValue ?? (null as T)

    if (Array.isArray(defaultValue))
      return data.filter(Boolean) as T

    return data[0] as T
  }, [location.search, name, defaultValue])

  const setValue = useCallback((v: T) => {
    const params = new URLSearchParams(location.search)
    const stringValue = Array.isArray(v) ? v.join(',') : String(v)

    if (stringValue === defaultValue?.toString()) {
      params.delete(name)
    }
    else {
      params.set(name, stringValue)
    }

    const newSearch = params.toString()
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname

    if (mode === 'push') {
      navigate(newPath)
    }
    else {
      navigate(newPath, { replace: true })
    }
  }, [location.search, location.pathname, name, defaultValue, mode, navigate])

  return [value, setValue]
}
