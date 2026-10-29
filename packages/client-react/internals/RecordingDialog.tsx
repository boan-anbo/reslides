/**
 * RecordingDialog component for React
 * Port of Vue client internals/RecordingDialog.vue
 *
 * Recording settings form (name, frame rate, resolution, bitrate, record
 * camera separately, output-filename preview, device selectors), wired to
 * the shared recording settings in logic/recording.ts. A previous version
 * was a placeholder whose Start button did nothing.
 */

import { useSyncExternalStore } from 'react'
import {
  bitRate,
  frameRate,
  getFilename,
  getRecordingVersion,
  mimeType,
  recordCamera,
  recorder,
  recordingName,
  resolution,
  subscribeRecording,
} from '../logic/recording'
import { DevicesSelectors } from './DevicesSelectors'
import { Modal } from './Modal'

const frameRateOptions = [15, 24, 30, 60]
const resolutionOptions = [
  { value: '1280x720', label: '720p (1280x720)' },
  { value: '1920x1080', label: '1080p (1920x1080)' },
  { value: '2560x1440', label: '1440p (2560x1440)' },
  { value: '3840x2160', label: '2160p (3840x2160)' },
]

export interface RecordingDialogProps {
  open: boolean
  onClose: () => void
}

export function RecordingDialog({ open, onClose }: RecordingDialogProps) {
  useSyncExternalStore(subscribeRecording, getRecordingVersion, getRecordingVersion)

  async function start() {
    onClose()
    // Vue: await nextTick() so the dialog unmounts before the screen-share
    // picker opens (the dialog would otherwise be part of the capture)
    await new Promise(resolve => setTimeout(resolve, 0))
    recorder.startRecording({
      mimeType: mimeType.value as any,
      bitsPerSecond: bitRate.value * 1024,
    })
  }

  return (
    <Modal open={open} onClose={onClose} className="px-6 py-4 recording-dialog flex flex-col gap-2">
      <div className="flex gap-2 text-xl">
        <div className="i-carbon:video my-auto" />
        Recording
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 py-2">
          <div className="form-text">
            <label htmlFor="title">Recording Name</label>
            <input
              className="bg-transparent text-current"
              name="title"
              type="text"
              placeholder="Enter the title..."
              value={recordingName.value}
              onChange={e => { recordingName.value = e.target.value }}
            />
            <div className="text-xs w-full opacity-50 py-2">
              <div>
                This will be used in the output filename that might
                <br />
                help you better organize your recording chips.
              </div>
            </div>
          </div>

          <div className="form-text">
            <label htmlFor="framerate">Frame Rate</label>
            <select
              className="bg-transparent text-current border border-main rounded px-2 py-1"
              name="framerate"
              value={frameRate.value}
              onChange={e => { frameRate.value = +e.target.value }}
            >
              {frameRateOptions.map(rate => (
                <option key={rate} value={rate}>{rate} fps</option>
              ))}
            </select>
          </div>

          <div className="form-text">
            <label htmlFor="resolution">Resolution</label>
            <select
              className="bg-transparent text-current border border-main rounded px-2 py-1"
              name="resolution"
              value={resolution.value}
              onChange={e => { resolution.value = e.target.value }}
            >
              {resolutionOptions.map(res => (
                <option key={res.value} value={res.value}>{res.label}</option>
              ))}
            </select>
          </div>

          <div className="form-text">
            <label htmlFor="bitrate">Bitrate</label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                step={1000}
                className="bg-transparent text-current border border-main rounded px-2 py-1 w-full pr-12"
                name="bitrate"
                value={bitRate.value}
                onChange={e => { bitRate.value = +e.target.value }}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm opacity-50">kbps</span>
            </div>
          </div>

          <div className="form-check">
            <input
              name="record-camera"
              type="checkbox"
              checked={recordCamera.value}
              onChange={e => { recordCamera.value = e.target.checked }}
            />
            <label htmlFor="record-camera" onClick={() => { recordCamera.value = !recordCamera.value }}>
              Record camera separately
            </label>
          </div>

          <div className="text-xs w-full opacity-50">
            <div className="mt-2 opacity-50">Enumerated filenames</div>
            <div className="font-mono">{getFilename('screen', mimeType.value)}</div>
            {recordCamera.value && (
              <div className="font-mono">{getFilename('camera', mimeType.value)}</div>
            )}
          </div>
        </div>
        <DevicesSelectors />
      </div>
      <div className="flex my-1">
        <button className="slidev-form-button" onClick={onClose}>
          Cancel
        </button>
        <div className="flex-auto" />
        <button className="slidev-form-button primary" onClick={start}>
          Start
        </button>
      </div>
    </Modal>
  )
}

export default RecordingDialog
