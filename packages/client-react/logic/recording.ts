/**
 * Recording logic for React
 * Port of Vue client logic/recording.ts
 *
 * Handles screen recording with RecordRTC.
 */

import type RecorderType from 'recordrtc'
import type { Options as RecorderOptions } from 'recordrtc'
import { isTruthy } from '@antfu/utils'
import { currentCamera, currentMic } from '../state'

type Defined<T> = T extends undefined ? never : T
type MimeType = Defined<RecorderOptions['mimeType']>

// Simple reactive state
let _recordingName = ''
let _recordCamera = true
let _mimeType: MimeType = (localStorage.getItem('slidev-record-mimetype') as MimeType) || 'video/webm'
let _frameRate = Number(localStorage.getItem('slidev-record-framerate')) || 30
let _bitRate = Number(localStorage.getItem('slidev-record-bitrate')) || 8192
let _resolution = localStorage.getItem('slidev-record-resolution') || '1920x1080'

const recordingListeners = new Set<() => void>()
let recordingVersion = 0

function notifyRecordingListeners() {
  recordingVersion++
  recordingListeners.forEach(fn => fn())
}

/** Monotonic version for useSyncExternalStore snapshots. */
export function getRecordingVersion() {
  return recordingVersion
}

/** Subscribe to any recording-related state change (settings, devices, recorder). */
export function subscribeRecording(fn: () => void) {
  recordingListeners.add(fn)
  return () => recordingListeners.delete(fn)
}

export const recordingName = {
  get value() { return _recordingName },
  set value(v: string) { _recordingName = v; notifyRecordingListeners() },
}

export const recordCamera = {
  get value() { return _recordCamera },
  set value(v: boolean) { _recordCamera = v; notifyRecordingListeners() },
}

export const mimeType = {
  get value() { return _mimeType },
  set value(v: MimeType) {
    _mimeType = v
    localStorage.setItem('slidev-record-mimetype', v)
    notifyRecordingListeners()
  },
}

export const frameRate = {
  get value() { return _frameRate },
  set value(v: number) {
    _frameRate = v
    localStorage.setItem('slidev-record-framerate', String(v))
    notifyRecordingListeners()
  },
}

export const bitRate = {
  get value() { return _bitRate },
  set value(v: number) {
    _bitRate = v
    localStorage.setItem('slidev-record-bitrate', String(v))
    notifyRecordingListeners()
  },
}

export const resolution = {
  get value() { return _resolution },
  set value(v: string) {
    _resolution = v
    localStorage.setItem('slidev-record-resolution', v)
    notifyRecordingListeners()
  },
}

export const mimeExtMap: Record<string, string> = {
  'video/webm': 'webm',
  'video/webm;codecs=h264': 'mp4',
  'video/x-matroska;codecs=avc1': 'mkv',
}

export function getFilename(media?: string, mimeTypeVal?: string) {
  const d = new Date()

  const pad = (v: number) => `${v}`.padStart(2, '0')

  const date = `${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`

  const ext = mimeTypeVal ? mimeExtMap[mimeTypeVal] : 'webm'

  return `${[media, recordingName.value, date].filter(isTruthy).join('-')}.${ext}`
}

function getSupportedMimeTypes() {
  if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function')
    return Object.keys(mimeExtMap).filter(mime => MediaRecorder.isTypeSupported(mime))
  return []
}

export const supportedMimeTypes = getSupportedMimeTypes()

// Device list management
let _devices: MediaDeviceInfo[] = []
let _cameras: MediaDeviceInfo[] = []
let _microphones: MediaDeviceInfo[] = []

export const devices = {
  get value() { return _devices },
}

export const cameras = {
  get value() { return _cameras },
}

export const microphones = {
  get value() { return _microphones },
}

export async function ensureDevicesListPermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach(track => track.stop())
  }
  catch {
    // Permission denied or not available
  }
  await updateDevicesList()
}

async function updateDevicesList() {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    _devices = allDevices
    _cameras = allDevices.filter(d => d.kind === 'videoinput')
    _microphones = allDevices.filter(d => d.kind === 'audioinput')

    // Update current selections if needed
    if (currentCamera.value !== 'none') {
      if (!_cameras.find(i => i.deviceId === currentCamera.value))
        currentCamera.value = _cameras[0]?.deviceId || 'default'
    }
    if (currentMic.value !== 'none') {
      if (!_microphones.find(i => i.deviceId === currentMic.value))
        currentMic.value = _microphones[0]?.deviceId || 'default'
    }

    notifyRecordingListeners()
  }
  catch (err) {
    console.warn('Failed to enumerate devices:', err)
  }
}

// Initialize device list listener
if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
  navigator.mediaDevices.addEventListener('devicechange', updateDevicesList)
}

export function download(name: string, url: string) {
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', name)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export interface UseRecordingResult {
  recording: { value: boolean }
  showAvatar: { value: boolean }
  toggleRecording: () => void
  startRecording: (customConfig?: RecorderOptions) => Promise<void>
  stopRecording: () => Promise<void>
  toggleAvatar: () => Promise<void>
  recorderCamera: { value: RecorderType | undefined }
  recorderSlides: { value: RecorderType | undefined }
  streamCamera: { value: MediaStream | undefined }
  streamCapture: { value: MediaStream | undefined }
  streamSlides: { value: MediaStream | undefined }
}

function createRecording(): UseRecordingResult {
  let _recording = false
  let _showAvatar = false
  let _recorderCamera: RecorderType | undefined
  let _recorderSlides: RecorderType | undefined
  let _streamCamera: MediaStream | undefined
  let _streamCapture: MediaStream | undefined
  let _streamSlides: MediaStream | undefined

  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach(fn => fn())
    notifyRecordingListeners()
  }

  const recording = {
    get value() { return _recording },
    set value(v: boolean) { _recording = v; notify() },
  }

  const showAvatar = {
    get value() { return _showAvatar },
    set value(v: boolean) { _showAvatar = v; notify() },
  }

  const recorderCamera = {
    get value() { return _recorderCamera },
    set value(v: RecorderType | undefined) { _recorderCamera = v; notify() },
  }

  const recorderSlides = {
    get value() { return _recorderSlides },
    set value(v: RecorderType | undefined) { _recorderSlides = v; notify() },
  }

  const streamCamera = {
    get value() { return _streamCamera },
    set value(v: MediaStream | undefined) { _streamCamera = v; notify() },
  }

  const streamCapture = {
    get value() { return _streamCapture },
    set value(v: MediaStream | undefined) { _streamCapture = v; notify() },
  }

  const streamSlides = {
    get value() { return _streamSlides },
    set value(v: MediaStream | undefined) { _streamSlides = v; notify() },
  }

  const config: RecorderOptions = {
    type: 'video',
    // Extending recording limit as default is only 1h (see https://github.com/muaz-khan/RecordRTC/issues/144)
    timeSlice: 24 * 60 * 60 * 1000,
  }

  async function toggleAvatar() {
    if (currentCamera.value === 'none')
      return

    if (showAvatar.value) {
      showAvatar.value = false
      if (!recording.value)
        closeStream(streamCamera)
    }
    else {
      await startCameraStream()
      if (streamCamera.value)
        showAvatar.value = !!streamCamera.value
    }
  }

  async function startCameraStream() {
    await ensureDevicesListPermissions()

    if (!streamCamera.value) {
      if (currentCamera.value === 'none' && currentMic.value === 'none')
        return

      streamCamera.value = await navigator.mediaDevices.getUserMedia({
        video: (currentCamera.value === 'none' || recordCamera.value !== true)
          ? false
          : {
              deviceId: currentCamera.value,
            },
        audio: currentMic.value === 'none'
          ? false
          : {
              deviceId: currentMic.value,
            },
      })
    }
  }

  async function startRecording(customConfig?: RecorderOptions) {
    await ensureDevicesListPermissions()
    const { default: Recorder } = await import('recordrtc')
    await startCameraStream()

    const [width, height] = resolution.value.split('x').map(Number)
    streamCapture.value = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: frameRate.value,
        width,
        height,
        // @ts-expect-error missing types
        cursor: 'motion',
        resizeMode: 'crop-and-scale',
      },
      // @ts-expect-error missing types
      selfBrowserSurface: 'include',
    })
    streamCapture.value.addEventListener('inactive', stopRecording)

    // We need to create a new Stream to merge video and audio to have the inactive event working on streamCapture
    streamSlides.value = new MediaStream()
    streamCapture.value!.getVideoTracks().forEach(videoTrack => streamSlides.value!.addTrack(videoTrack))

    // merge config
    Object.assign(config, customConfig)

    if (streamCamera.value) {
      const audioTrack = streamCamera.value!.getAudioTracks()?.[0]
      if (audioTrack)
        streamSlides.value!.addTrack(audioTrack)

      recorderCamera.value = new Recorder(
        streamCamera.value!,
        config,
      )
      recorderCamera.value.startRecording()
    }

    recorderSlides.value = new Recorder(
      streamSlides.value!,
      config,
    )

    recorderSlides.value.startRecording()
    recording.value = true
  }

  async function stopRecording() {
    recording.value = false
    recorderCamera.value?.stopRecording(() => {
      if (recordCamera.value) {
        const blob = recorderCamera.value!.getBlob()
        const url = URL.createObjectURL(blob)
        download(getFilename('camera', config.mimeType), url)
        window.URL.revokeObjectURL(url)
      }
      recorderCamera.value = undefined
      if (!showAvatar.value)
        closeStream(streamCamera)
    })
    recorderSlides.value?.stopRecording(() => {
      const blob = recorderSlides.value!.getBlob()
      const url = URL.createObjectURL(blob)
      download(getFilename('screen', config.mimeType), url)
      window.URL.revokeObjectURL(url)
      closeStream(streamCapture)
      closeStream(streamSlides)
      recorderSlides.value = undefined
    })
  }

  function closeStream(stream: { value: MediaStream | undefined }) {
    const s = stream.value
    if (!s)
      return
    s.getTracks().forEach((i) => {
      i.stop()
      s.removeTrack(i)
    })
    stream.value = undefined
  }

  function toggleRecording() {
    if (recording.value)
      stopRecording()
    else
      startRecording()
  }

  // Warn before unload if recording
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (event) => {
      if (!recording.value)
        return
      // eslint-disable-next-line no-alert
      if (confirm('Recording is not saved yet, do you want to leave?'))
        return
      event.preventDefault()
      event.returnValue = ''
    })
  }

  return {
    recording,
    showAvatar,
    toggleRecording,
    startRecording,
    stopRecording,
    toggleAvatar,
    recorderCamera,
    recorderSlides,
    streamCamera,
    streamCapture,
    streamSlides,
  }
}

// Singleton recorder instance - ALL consumers must share this (camera
// stream, recorder instances and avatar state are process-wide resources;
// per-caller copies would each open their own camera).
export const recorder = createRecording()

export function useRecording(): UseRecordingResult {
  return recorder
}
