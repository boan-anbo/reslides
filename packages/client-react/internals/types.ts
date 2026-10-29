/**
 * Internal types for React
 * Port of Vue client internals/types.ts
 */

export interface SelectionItem<T> {
  value: T
  display: string
  onClick?: () => void
}
