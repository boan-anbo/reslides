/**
 * FormCheckbox component for React
 * Port of Vue client internals/FormCheckbox.vue
 */

export interface FormCheckboxProps {
  label?: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function FormCheckbox({
  label,
  value,
  onChange,
  disabled = false,
}: FormCheckboxProps) {
  return (
    <div className="relative h-5 w-5 p-0.5 p-1 flex items-center gap-2 border border-main rounded hover:bg-active">
      <div className={`i-ri-check-line ${value ? '' : 'opacity-0'}`} />
      <input
        type="checkbox"
        aria-label={label}
        checked={value}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="absolute inset-0 opacity-10"
      />
    </div>
  )
}
