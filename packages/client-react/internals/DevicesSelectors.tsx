/**
 * DevicesSelectors component for React
 * Port of Vue client internals/DevicesSelectors.vue
 *
 * Camera / microphone / video-format dropdowns, bound to the GLOBAL
 * currentCamera/currentMic/mimeType state consumed by logic/recording.ts.
 * (A previous version kept the selection in local component state, so the
 * recorder never saw it.)
 */
import type { SelectionItem } from './types'
import { useEffect, useSyncExternalStore } from 'react'
import {
  cameras,
  ensureDevicesListPermissions,
  getRecordingVersion,
  microphones,
  mimeExtMap,
  mimeType,
  subscribeRecording,
  supportedMimeTypes,
} from '../logic/recording'
import { currentCamera, currentMic, subscribeStorage } from '../state/storage'
import { SelectList } from './SelectList'

const mimeTypeItems = supportedMimeTypes.map(mime => ({
  value: mime,
  display: mimeExtMap[mime].toUpperCase(),
}))

export function DevicesSelectors() {
  useSyncExternalStore(subscribeRecording, getRecordingVersion, getRecordingVersion)
  const camera = useSyncExternalStore(subscribeStorage, () => currentCamera.value, () => 'default')
  const mic = useSyncExternalStore(subscribeStorage, () => currentMic.value, () => 'default')

  useEffect(() => {
    ensureDevicesListPermissions()
  }, [])

  const camerasItems: SelectionItem<string>[] = [
    { value: 'none', display: 'None' },
    ...cameras.value.map(i => ({ value: i.deviceId, display: i.label })),
  ]

  const microphonesItems: SelectionItem<string>[] = [
    { value: 'none', display: 'None' },
    ...microphones.value.map(i => ({ value: i.deviceId, display: i.label })),
  ]

  return (
    <div className="text-sm flex flex-col gap-2">
      <SelectList
        title="Camera"
        value={camera}
        onChange={(v: string) => { currentCamera.value = v }}
        items={camerasItems}
      />
      <div className="h-1px opacity-10 bg-current w-full" />
      <SelectList
        title="Microphone"
        value={mic}
        onChange={(v: string) => { currentMic.value = v }}
        items={microphonesItems}
      />
      {mimeTypeItems.length > 0 && (
        <>
          <div className="h-1px opacity-10 bg-current w-full" />
          <SelectList
            title="Video Format"
            value={mimeType.value}
            onChange={(v: string) => { mimeType.value = v as typeof mimeType.value }}
            items={mimeTypeItems}
          />
        </>
      )}
    </div>
  )
}

export default DevicesSelectors
