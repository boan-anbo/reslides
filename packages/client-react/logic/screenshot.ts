/**
 * Screenshot logic for React
 * Port of Vue client logic/screenshot.ts
 *
 * Handles screen capture for snapshots.
 */

export interface ScreenshotSession {
  isActive: { value: boolean }
  screenshot: (element: HTMLElement) => string
  dispose: () => void
}

export async function startScreenshotSession(width: number, height: number): Promise<ScreenshotSession> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const video = document.createElement('video')
  video.width = width
  video.height = height

  let captureStream: MediaStream | null = await navigator.mediaDevices.getDisplayMedia({
    video: {
      // Use a rather small frame rate
      frameRate: 10,
      // @ts-expect-error missing types
      cursor: 'never',
    },
    // @ts-expect-error missing types
    selfBrowserSurface: 'include',
    preferCurrentTab: true,
  })

  captureStream.addEventListener('inactive', dispose)

  video.srcObject = captureStream
  video.play()

  function screenshot(element: HTMLElement): string {
    if (!captureStream)
      throw new Error('captureStream inactive')

    context.clearRect(0, 0, width, height)
    const { left, top, width: elWidth } = element.getBoundingClientRect()
    context.drawImage(
      video,
      left * window.devicePixelRatio,
      top * window.devicePixelRatio,
      elWidth * window.devicePixelRatio,
      elWidth / width * height * window.devicePixelRatio,
      0,
      0,
      width,
      height,
    )
    return canvas.toDataURL('image/png')
  }

  function dispose() {
    captureStream?.getTracks().forEach(track => track.stop())
    captureStream = null
  }

  return {
    isActive: {
      get value() { return !!captureStream },
    },
    screenshot,
    dispose,
  }
}

const chromeVersion = typeof window !== 'undefined'
  ? window.navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
  : null

export const isScreenshotSupported = chromeVersion ? Number(chromeVersion) >= 94 : false
