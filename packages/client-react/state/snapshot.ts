/**
 * Snapshot state for React
 * Port of Vue client state/snapshot.ts
 *
 * Syncs snapshot state with server.
 */

import serverSnapshotState from 'server-reactive:snapshots?diff'
import { createSyncState } from './syncState'
import { getServerStateSnapshot } from './serverState'

export type SnapshotState = Record<string, {
  revision: string
  image: string
}>

export const snapshotState = createSyncState<SnapshotState>(
  serverSnapshotState,
  getServerStateSnapshot(serverSnapshotState),
  true,
)
