/**
 * ScreenCaptureMirror component for React
 * Port of Vue client internals/ScreenCaptureMirror.vue
 *
 * Mirrors screen capture for presenter view.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export function ScreenCaptureMirror() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCapture = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      setStream(mediaStream)
      setError(null)

      // Handle stream ending
      mediaStream.getTracks().forEach(track => {
        track.onended = () => {
          setStream(null)
        }
      })
    }
    catch (err) {
      setError('Screen capture was cancelled or denied')
    }
  }, [])

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  useEffect(() => {
    // The video is mounted only after setStream commits.
    if (videoRef.current)
      videoRef.current.srcObject = stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="screen-capture-mirror relative w-full h-full bg-black rounded overflow-hidden">
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          <button
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={stopCapture}
          >
            Stop
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="i-carbon:screen text-4xl opacity-50 mb-2" />
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
            onClick={startCapture}
          >
            Share Screen
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
