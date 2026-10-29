/**
 * FormItem component for React
 * Port of Vue client internals/FormItem.vue
 */

import type { ReactNode } from 'react'

export interface FormItemProps {
  title: string
  nested?: boolean | number
  div?: boolean
  description?: string
  dot?: boolean
  children?: ReactNode
  onReset?: () => void
}

export function FormItem({
  title,
  nested,
  div = false,
  description,
  dot = false,
  children,
  onReset,
}: FormItemProps) {
  const Component = div ? 'div' : 'label'

  const handleDoubleClick = () => {
    onReset?.()
  }

  const nestedStyle = typeof nested === 'number'
    ? { marginLeft: `${nested * 0.5 + 0.5}rem` }
    : nested
      ? { marginLeft: '0.25rem' }
      : undefined

  return (
    <Component className="flex flex-row gap-2 items-center select-none">
      <div className="w-30 h-8 flex gap-1 items-center">
        {nested && (
          <div
            className="i-ri-corner-down-right-line opacity-40"
            style={nestedStyle}
          />
        )}
        {!description ? (
          <div className="opacity-75 relative" onDoubleClick={handleDoubleClick}>
            {title}
            {dot && (
              <div className="w-1.5 h-1.5 bg-primary rounded absolute top-0 right--2" />
            )}
          </div>
        ) : (
          <div
            className="opacity-75 text-right relative"
            onDoubleClick={handleDoubleClick}
            title={description}
          >
            {title}
            {dot && (
              <div className="w-1.5 h-1.5 bg-primary rounded absolute top-0 right--2" />
            )}
          </div>
        )}
      </div>
      {children}
    </Component>
  )
}
