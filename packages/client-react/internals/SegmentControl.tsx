/**
 * SegmentControl component for React
 * Port of Vue client internals/SegmentControl.vue
 */

export interface SegmentOption<T = string> {
  label: string
  value: T
}

export interface SegmentControlProps<T = string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Vue parity: grey out and ignore clicks (e.g. colorSchema configured) */
  disabled?: boolean
}

export function SegmentControl<T = string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentControlProps<T>) {
  return (
    <div className={`flex gap-1 items-center rounded bg-gray/4 p-1 m--1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {options.map(option => (
        <button
          key={String(option.value)}
          type="button"
          disabled={disabled}
          className={`px-2 py-1 text-xs font-mono rounded ${option.value === value ? 'bg-gray/10' : 'opacity-50'}`}
          aria-pressed={option.value === value}
          onClick={() => !disabled && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
