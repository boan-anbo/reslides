/**
 * FormSlider component for React
 * Port of Vue client internals/FormSlider.vue
 */

import './FormSlider.css'

export interface FormSliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  max: number
  min: number
  step: number
  unit?: string
  defaultValue?: number
}

export function FormSlider({
  label,
  value,
  onChange,
  max,
  min,
  step,
  unit,
  defaultValue,
}: FormSliderProps) {
  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue)
    }
  }

  return (
    <>
      <div
        className="relative h-22px w-60 flex-auto"
        onDoubleClick={handleDoubleClick}
      >
        <input
          type="range"
          aria-label={label}
          className="slider absolute bottom-0 left-0 right-0 top-0 z-10 w-full align-top"
          value={value}
          onChange={e => { const value = e.target.valueAsNumber; if (Number.isFinite(value)) onChange(Math.min(max, Math.max(min, value))) }}
          max={max}
          min={min}
          step={step}
        />
        {defaultValue != null && (
          <span
            className="border-r border-main absolute bottom-0 top-0 h-full w-px opacity-75"
            style={{
              left: `${(defaultValue - min) / (max - min) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="relative h-22px">
        <input
          type="number"
          aria-label={label ? `${label} value` : undefined}
          value={value}
          onChange={e => { const value = e.target.valueAsNumber; if (Number.isFinite(value)) onChange(Math.min(max, Math.max(min, value))) }}
          max={max}
          min={min}
          step={step}
          className="border border-main rounded m-0 w-20 bg-gray/5 pl-2 align-top text-sm"
        />
        {unit && (
          <span className="pointer-events-none absolute right-1 top-0.5 text-xs opacity-25">
            {unit}
          </span>
        )}
      </div>
    </>
  )
}
