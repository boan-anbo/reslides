/**
 * Snapshot logic for React
 * Port of Vue client logic/snapshot.ts
 *
 * Manages slide snapshots for preview.
 */

import type { SlidevContextNavFull } from '../hooks/useNav'
import type { ScreenshotSession } from './screenshot'
import { sleep } from '@antfu/utils'
import { slideHeight, slideWidth } from '../env'
import { captureDelay, disableTransition } from '../state/storage'
import { snapshotState } from '../state/snapshot'
import { isDark } from './dark'
import { startScreenshotSession } from './screenshot'
import { getSlide } from './slides'

declare const __DEV__: boolean

const chromeVersion = typeof window !== 'undefined'
  ? window.navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
  : null

export const isScreenshotSupported = chromeVersion ? Number(chromeVersion) >= 94 : false

const initialWait = 100

export class SlideSnapshotManager {
  private _screenshotSession: ScreenshotSession | null = null

  getSnapshot(slideNo: number, isDarkMode: boolean) {
    const id = slideNo + (isDarkMode ? '-dark' : '-light')
    const data = snapshotState.state[id]
    if (!data) {
      return
    }
    const slide = getSlide(slideNo)
    if (!slide) {
      return
    }
    if (data?.revision === slide?.meta.slide.revision) {
      return data.image
    }
  }

  private async saveSnapshot(slideNo: number, dataUrl: string, isDarkMode: boolean) {
    if (typeof __DEV__ !== 'undefined' && !__DEV__)
      return false

    const slide = getSlide(slideNo)
    if (!slide)
      return false

    const id = slideNo + (isDarkMode ? '-dark' : '-light')
    const revision = slide.meta.slide.revision
    snapshotState.patch(id, {
      revision,
      image: dataUrl,
    })
  }

  async startCapturing(nav: SlidevContextNavFull) {
    if (typeof __DEV__ !== 'undefined' && !__DEV__)
      return false

    // TODO: show a dialog to confirm

    if (this._screenshotSession) {
      this._screenshotSession.dispose()
      this._screenshotSession = null
    }

    try {
      this._screenshotSession = await startScreenshotSession(
        slideWidth.value,
        slideHeight.value,
      )

      disableTransition.value = true
      nav.go(1, 0, true)

      await sleep(initialWait + captureDelay.value)
      while (true) {
        if (!this._screenshotSession) {
          break
        }
        this.saveSnapshot(
          nav.currentSlideNo.value,
          this._screenshotSession.screenshot(document.getElementById('slide-content')!),
          isDark.value,
        )
        if (nav.hasNext.value) {
          await sleep(captureDelay.value)
          nav.nextSlide(true)
          await sleep(captureDelay.value)
        }
        else {
          break
        }
      }

      // TODO: show a message when done

      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
    finally {
      disableTransition.value = false
      if (this._screenshotSession) {
        this._screenshotSession.dispose()
        this._screenshotSession = null
      }
    }
  }
}

export const snapshotManager = new SlideSnapshotManager()
