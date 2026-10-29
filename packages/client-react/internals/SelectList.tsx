/**
 * SelectList component for React
 * Port of Vue client internals/SelectList.vue
 */

import type { SelectionItem } from './types'
import './SelectList.css'

export interface SelectListProps<T = any> {
  value: T
  onChange: (value: T) => void
  title?: string
  items: SelectionItem<T>[]
}

export function SelectList<T = any>({
  value,
  onChange,
  title,
  items,
}: SelectListProps<T>) {
  return (
    <div className="select-list">
      {title && <div className="title">{title}</div>}
      <div className="items">
        {items.map(item => (
          <div
            key={String(item.value)}
            className={`item ${value === item.value ? 'active' : ''}`}
            onClick={() => {
              onChange(item.value)
              item.onClick?.()
            }}
          >
            <div
              className={`i-carbon:checkmark text-green-500 my-auto ${value !== item.value ? 'opacity-0' : ''}`}
            />
            <div className={value !== item.value ? 'opacity-50' : ''}>
              {item.display || String(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
