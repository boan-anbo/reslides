/**
 * SyncControls component for React
 * Port of Vue client internals/SyncControls.vue
 *
 * Per-window navigation-sync direction toggles (send / receive), persisted
 * in syncDirections and consulted by useNav's shared-state send/receive.
 */

import { useSyncExternalStore } from 'react'
import { useNav } from '../hooks/useNav'
import { subscribeStorage, syncDirections } from '../state/storage'
import { IconButton } from './IconButton'
import { MenuButton } from './MenuButton'
import { SelectList } from './SelectList'

type SyncMode = 'bidirectional' | 'receive-only' | 'send-only' | 'off'

export function SyncControls() {
  const { isPresenter } = useNav()
  const directions = useSyncExternalStore(subscribeStorage, () => syncDirections.value, () => syncDirections.value)

  const shouldSend = isPresenter ? directions.presenterSend : directions.viewerSend
  const shouldReceive = isPresenter ? directions.presenterReceive : directions.viewerReceive

  const state: SyncMode = shouldReceive && shouldSend
    ? 'bidirectional'
    : shouldReceive
      ? 'receive-only'
      : shouldSend
        ? 'send-only'
        : 'off'

  const setState = (mode: SyncMode) => {
    const send = mode === 'bidirectional' || mode === 'send-only'
    const receive = mode === 'bidirectional' || mode === 'receive-only'
    syncDirections.value = isPresenter
      ? { ...directions, presenterSend: send, presenterReceive: receive }
      : { ...directions, viewerSend: send, viewerReceive: receive }
  }

  return (
    <MenuButton
      button={
        <IconButton title="Change sync settings">
          <div className={`i-ph:arrow-up-bold mx--1.2 scale-x-80 ${shouldSend ? 'text-green6 dark:text-green' : 'op30'}`} />
          <div className={`i-ph:arrow-down-bold mx--1.2 scale-x-80 ${shouldReceive ? 'text-green6 dark:text-green' : 'op30'}`} />
        </IconButton>
      }
      menu={
        <div className="text-sm flex flex-col gap-2">
          <div className="px-3 ws-nowrap">
            <span className="op75">Slides navigation syncing for </span>
            <span className="font-bold text-primary">{isPresenter ? 'presenter' : 'viewer'}</span>
          </div>
          <div className="h-1px opacity-10 bg-current w-full" />
          <SelectList
            title="Sync Mode"
            value={state}
            onChange={setState}
            items={[
              { value: 'bidirectional', display: 'Bidirectional Sync' },
              { value: 'receive-only', display: 'Receive Only' },
              { value: 'send-only', display: 'Send Only' },
              { value: 'off', display: 'Disable' },
            ]}
          />
        </div>
      }
    />
  )
}
