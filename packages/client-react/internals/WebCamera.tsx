/**
 * WebCamera component for React
 * Port of Vue client internals/WebCamera.vue
 *
 * Draggable, resizable circular camera preview shown while
 * recorder.showAvatar is on. Reads the SHARED recorder singleton's
 * streamCamera (a previous version kept its own webcam state and opened a
 * second camera stream nothing else knew about).
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getRecordingVersion, recorder, subscribeRecording } from '../logic/recording'
import { currentCamera, subscribeStorage } from '../state/storage'

function readStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v != null ? JSON.parse(v) : fallback
  }
  catch {
    return fallback
  }
}

export function WebCamera() {
  useSyncExternalStore(subscribeRecording, getRecordingVersion, getRecordingVersion)
  const camera = useSyncExternalStore(subscribeStorage, () => currentCamera.value, () => 'default')

  const videoRef = useRef<HTMLVideoElement>(null)

  const [size, setSize] = useState(() => readStored(
    'slidev-webcam-size',
    Math.round(Math.min(window.innerHeight, window.innerWidth / 8)),
  ))
  const [position, setPosition] = useState(() => readStored('slidev-webcam-pos', {
    x: window.innerWidth - readStored('slidev-webcam-size', 130) - 30,
    y: window.innerHeight - readStored('slidev-webcam-size', 130) - 30,
  }))
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    localStorage.setItem('slidev-webcam-size', JSON.stringify(size))
  }, [size])
  useEffect(() => {
    localStorage.setItem('slidev-webcam-pos', JSON.stringify(position))
  }, [position])

  const streamCamera = recorder.streamCamera.value
  const showAvatar = recorder.showAvatar.value

  // Attach the shared camera stream to the video element (Vue watchEffect)
  useEffect(() => {
    if (videoRef.current && streamCamera)
      videoRef.current.srcObject = streamCamera
  }, [streamCamera, showAvatar])

  // Keep the circle inside the viewport on resize (Vue fixPosition)
  useEffect(() => {
    const fixPosition = () => {
      setPosition(p => ({
        x: p.x >= window.innerWidth ? window.innerWidth - size - 30 : p.x,
        y: p.y >= window.innerHeight ? window.innerHeight - size - 30 : p.y,
      }))
    }
    fixPosition()
    window.addEventListener('resize', fixPosition)
    return () => window.removeEventListener('resize', fixPosition)
  }, [size])

  // Drag-to-move (frame) and drag-to-resize (handle)
  const dragState = useRef<{ mode: 'move' | 'resize', dx: number, dy: number } | null>(null)

  const onFramePointerDown = (e: React.PointerEvent) => {
    dragState.current = { mode: 'move', dx: e.clientX - position.x, dy: e.clientY - position.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    dragState.current = { mode: 'resize', dx: 0, dy: 0 }
    setResizing(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragState.current
    if (!st) return
    if (st.mode === 'move') {
      setPosition({ x: e.clientX - st.dx, y: e.clientY - st.dy })
    }
    else {
      // Vue: size = max(10, min(x - pos.x, y - pos.y) / 0.8536)
      setSize(Math.max(10, Math.min(e.clientX - position.x, e.clientY - position.y) / 0.8536))
    }
  }
  const onPointerUp = () => {
    dragState.current = null
    setResizing(false)
  }

  if (!streamCamera || !showAvatar || camera === 'none')
    return null

  return (
    <div
      className="fixed z-camera"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="rounded-full shadow bg-gray-400 bg-opacity-10 overflow-hidden object-cover"
        style={{ width: `${size}px`, height: `${size}px`, cursor: 'move' }}
        onPointerDown={onFramePointerDown}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          className="object-cover min-w-full min-h-full rounded-full"
          style={{ transform: 'rotateY(180deg)' }}
        />
      </div>
      <div
        className={`absolute rounded-full bg-main shadow z-dragging hover:opacity-100 dark:border dark:border-true-gray-700 ${resizing ? 'opacity-100' : 'opacity-0'}`}
        style={{
          width: '14px',
          height: '14px',
          top: `${size * 0.8536 - 7}px`,
          left: `${size * 0.8536 - 7}px`,
          cursor: 'nwse-resize',
        }}
        onPointerDown={onHandlePointerDown}
      />
    </div>
  )
}

export default WebCamera
