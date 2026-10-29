/**
 * RecordingControls component for React
 * Port of Vue client internals/RecordingControls.vue
 *
 * Camera-avatar toggle + record start/stop + device-select menu, all
 * driven by the shared recorder singleton (a previous version kept its
 * own fake recording flag with noop toggles).
 */

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getRecordingVersion, recorder, subscribeRecording } from '../logic/recording'
import { currentCamera, subscribeStorage } from '../state/storage'
import { setShowRecordingDialog } from './Controls'
import { DevicesSelectors } from './DevicesSelectors'
import { IconButton } from './IconButton'
import { MenuButton } from './MenuButton'

export function RecordingControls() {
  useSyncExternalStore(subscribeRecording, getRecordingVersion, getRecordingVersion)
  const camera = useSyncExternalStore(subscribeStorage, () => currentCamera.value, () => 'default')

  const recording = recorder.recording.value
  const showAvatar = recorder.showAvatar.value
  const streamCamera = recorder.streamCamera.value

  // Vue: persist avatar visibility, restore it on mount
  useEffect(() => {
    try {
      localStorage.setItem('slidev-webcam-show', JSON.stringify(showAvatar))
    }
    catch {}
  }, [showAvatar])

  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    try {
      const previous = JSON.parse(localStorage.getItem('slidev-webcam-show') || 'false')
      if (previous && !recorder.showAvatar.value)
        recorder.toggleAvatar()
    }
    catch {}
  }, [])

  // Vue: not recording -> open the settings dialog; recording -> stop
  function toggleRecording() {
    if (recorder.recording.value)
      recorder.stopRecording()
    else
      setShowRecordingDialog(true)
  }

  return (
    <>
      {camera !== 'none' && (
        <IconButton
          className={`lt-md:hidden ${showAvatar && streamCamera ? 'text-green-500' : ''}`}
          title="Toggle camera view"
          onClick={() => recorder.toggleAvatar()}
        >
          <div className="i-carbon:user-avatar" />
        </IconButton>
      )}
      <IconButton
        className={recording ? 'text-red-500' : ''}
        title={recording ? 'Stop record video' : 'Record video'}
        onClick={toggleRecording}
      >
        <div className={recording ? 'i-carbon:stop-outline' : 'i-carbon:video'} />
      </IconButton>
      <MenuButton
        disabled={recording}
        button={
          <IconButton title="Select recording device">
            <div className="i-carbon:chevron-up opacity-50" />
          </IconButton>
        }
        menu={<DevicesSelectors />}
      />
    </>
  )
}

export default RecordingControls
