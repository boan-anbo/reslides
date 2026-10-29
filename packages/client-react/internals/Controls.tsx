/**
 * Controls component for React
 * Port of Vue client internals/Controls.vue
 *
 * Main controls container that lazy-loads optional components.
 * Dialog visibility lives in state/storage.ts (showInfoDialog /
 * showRecordingDialog) - a previous version kept module-local flags whose
 * setters notified listeners nothing subscribed to, so e.g. the toolbar
 * info button did nothing.
 */

import { lazy, Suspense, useSyncExternalStore } from 'react'
import { useNav } from '../hooks/useNav'
import { configs } from '../env'
import { showInfoDialog, showRecordingDialog, subscribeStorage } from '../state/storage'
import { ContextMenu } from './ContextMenu'
import { Goto } from './Goto'
import { InfoDialog } from './InfoDialog'
import { QuickOverview } from './QuickOverview'

// Lazy load optional components
const DrawingControls = lazy(() => import('./DrawingControls').then(m => ({ default: m.DrawingControls })))
const WebCamera = lazy(() => import('./WebCamera').then(m => ({ default: m.WebCamera })))
const RecordingDialog = lazy(() => import('./RecordingDialog').then(m => ({ default: m.RecordingDialog })))

export function setShowInfoDialog(value: boolean) {
  showInfoDialog.value = value
}

export function setShowRecordingDialog(value: boolean) {
  showRecordingDialog.value = value
}

export function Controls() {
  const { isEmbedded } = useNav()
  const infoOpen = useSyncExternalStore(subscribeStorage, () => showInfoDialog.value, () => false)
  const recordingOpen = useSyncExternalStore(subscribeStorage, () => showRecordingDialog.value, () => false)

  // @ts-expect-error - __SLIDEV_FEATURE_DRAWINGS__ is a global
  const drawingEnabled = __SLIDEV_FEATURE_DRAWINGS__ && !configs.drawings.presenterOnly && !isEmbedded
  // @ts-expect-error - __SLIDEV_FEATURE_RECORD__ is a global
  const recordEnabled = __SLIDEV_FEATURE_RECORD__

  return (
    <>
      {drawingEnabled && (
        <Suspense fallback={null}>
          <DrawingControls />
        </Suspense>
      )}
      <QuickOverview />
      <Goto />
      {recordEnabled && (
        <Suspense fallback={null}>
          <WebCamera />
          <RecordingDialog open={recordingOpen} onClose={() => setShowRecordingDialog(false)} />
        </Suspense>
      )}
      {configs.info && (
        <InfoDialog open={infoOpen} onClose={() => setShowInfoDialog(false)} />
      )}
      <ContextMenu />
    </>
  )
}
