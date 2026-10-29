/** Display settings operate on the same persisted state as the slide renderer. */
import { useSyncExternalStore } from 'react'
import { useNav } from '../hooks/useNav'
import { hideCursorIdle, slideScale, subscribeStorage, viewerCssFilter, viewerCssFilterDefaults, wakeLockEnabled } from '../state/storage'
import { FormCheckbox } from './FormCheckbox'
import { FormItem } from './FormItem'
import { FormSlider } from './FormSlider'
import { SegmentControl } from './SegmentControl'

const sliders = [
  { key: 'brightness', title: 'Brightness', min: 0.5, max: 1.5, step: 0.02 },
  { key: 'contrast', title: 'Contrast', min: 0.5, max: 1.5, step: 0.02 },
  { key: 'saturate', title: 'Saturation', min: 0.5, max: 1.5, step: 0.02 },
  { key: 'sepia', title: 'Sepia', min: 0, max: 1, step: 0.02 },
  { key: 'hueRotate', title: 'Hue Rotate', min: -180, max: 180, step: 1 },
] as const

export function Settings() {
  const { isPresenter } = useNav()
  const filters = useSyncExternalStore(subscribeStorage, () => viewerCssFilter.value)
  const scale = useSyncExternalStore(subscribeStorage, () => slideScale.value)
  const awake = useSyncExternalStore(subscribeStorage, () => wakeLockEnabled.value)
  const hideCursor = useSyncExternalStore(subscribeStorage, () => hideCursorIdle.value)
  return (
    <div aria-label="Display settings" className="p-4 flex flex-col gap-2 text-sm max-w-[calc(100vw-2rem)]">
      <FormItem title="Invert" dot={filters.invert} onReset={() => { viewerCssFilter.value = { ...filters, invert: false } }}>
        <FormCheckbox label="Invert" value={filters.invert} onChange={invert => { viewerCssFilter.value = { ...filters, invert } }} />
      </FormItem>
      {sliders.map(({ key, title, min, max, step }) => (
        <FormItem key={key} title={title} dot={filters[key] !== viewerCssFilterDefaults[key]} onReset={() => { viewerCssFilter.value = { ...filters, [key]: viewerCssFilterDefaults[key] } }}>
          <FormSlider label={title} value={filters[key]} onChange={value => { viewerCssFilter.value = { ...filters, [key]: value } }} min={min} max={max} step={step} defaultValue={viewerCssFilterDefaults[key]} />
        </FormItem>
      ))}
      {!isPresenter && (
        <FormItem title="Slide Scale" div>
          <SegmentControl value={scale} onChange={value => { slideScale.value = value }} options={[{ label: 'Fit', value: 0 }, { label: '1:1', value: 1 }]} />
        </FormItem>
      )}
      {__SLIDEV_FEATURE_WAKE_LOCK__ && 'wakeLock' in navigator && (
        <FormItem title="Wake Lock"><FormCheckbox label="Wake Lock" value={awake} onChange={value => { wakeLockEnabled.value = value }} /></FormItem>
      )}
      {!isPresenter && (
        <FormItem title="Hide Idle Cursor"><FormCheckbox label="Hide Idle Cursor" value={hideCursor} onChange={value => { hideCursorIdle.value = value }} /></FormItem>
      )}
      <button type="button" className="self-end border border-main rounded px-2 py-1" onClick={() => { viewerCssFilter.value = { ...viewerCssFilterDefaults }; slideScale.value = 0 }}>Reset display</button>
    </div>
  )
}
