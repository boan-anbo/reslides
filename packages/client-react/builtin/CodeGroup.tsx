/**
 * CodeGroup component for React
 * Port of Vue client builtin/CodeGroup.vue
 *
 * Tabbed code blocks
 */

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TitleIcon } from '../internals/TitleIcon'

// Context for sharing active title with CodeBlockWrapper children
export const ActiveTitleContext = createContext<{
  activeTitle: string
  setActiveTitle: (title: string) => void
} | null>(null)

export function useActiveTitle() {
  return useContext(ActiveTitleContext)
}

export interface CodeGroupProps {
  children?: ReactNode
}

export function CodeGroup({ children }: CodeGroupProps) {
  const [activeTitle, setActiveTitle] = useState('')
  const [tabs, setTabs] = useState<string[]>([])
  const codeGroupBlocksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const codeGroupBlocks = codeGroupBlocksRef.current
    let isActiveSet = false
    const newTabs: string[] = []

    codeGroupBlocks?.querySelectorAll('.slidev-code-wrapper')?.forEach((block) => {
      const title = block.getAttribute('data-title') || ''
      if (title) {
        if (!isActiveSet) {
          setActiveTitle(title)
          isActiveSet = true
        }
        newTabs.push(title)
      }
    })

    setTabs(newTabs)
  }, [children])

  const contextValue = useMemo(() => ({
    activeTitle,
    setActiveTitle,
  }), [activeTitle])

  return (
    <div className="slidev-code-group">
      <div className="slidev-code-group-tabs">
        {tabs.map(tab => (
          <div key={tab} className="flex items-center">
            <div
              className="slidev-code-tab"
              style={{
                borderColor: activeTitle === tab ? 'var(--slidev-theme-primary)' : 'transparent',
                color: activeTitle === tab ? 'var(--slidev-code-tab-active-text-color)' : 'var(--slidev-code-tab-text-color)',
              }}
              onClick={() => setActiveTitle(tab)}
            >
              <TitleIcon title={tab} />
              <div>
                {tab.replace(/~([^~]+)~/g, '').trim()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ActiveTitleContext.Provider value={contextValue}>
        <div ref={codeGroupBlocksRef} className="slidev-code-group-blocks">
          {children}
        </div>
      </ActiveTitleContext.Provider>
    </div>
  )
}

export default CodeGroup
