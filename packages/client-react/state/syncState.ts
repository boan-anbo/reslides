/**
 * Sync State for @slidev/client-react
 * Port of packages/client/state/syncState.ts to React
 *
 * This handles state synchronization between presenter and viewer windows
 * using BroadcastChannel (with localStorage fallback for persistence)
 */

// ============================================================================
// Types
// ============================================================================

export type SyncWrite<State extends object> = (state: State, updating?: boolean) => void

export interface Sync {
  enabled?: boolean
  init: <State extends object>(
    channelKey: string,
    onUpdate: (data: Partial<State>) => void,
    state: State,
    persist?: boolean
  ) => SyncWrite<State> | undefined
}

interface BuiltinSync extends Sync {
  channels: BroadcastChannel[]
  disable: () => void
  listener?: (event: StorageEvent) => void
}

// ============================================================================
// Globals (compile-time constants)
// ============================================================================

declare global {
  const __SLIDEV_HAS_SERVER__: boolean
}

import { clone } from 'vite-plugin-vue-server-ref/client'
import { isServerState, type ServerState } from './serverState'

const hasServer = __SLIDEV_HAS_SERVER__

// ============================================================================
// Built-in Sync Implementation
// ============================================================================

const builtinSync: BuiltinSync = {
  channels: [],
  enabled: true,
  init<State extends object>(
    channelKey: string,
    onUpdate: (data: Partial<State>) => void,
    state: State,
    persist = false
  ) {
    let stateChannel: BroadcastChannel | undefined

    if (!persist) {
      stateChannel = new BroadcastChannel(channelKey)
      stateChannel.addEventListener('message', (event: MessageEvent<Partial<State>>) => onUpdate(event.data))
      this.channels.push(stateChannel)
    }
    else if (persist) {
      this.listener = function (event: StorageEvent) {
        if (event && event.key === channelKey && event.newValue)
          onUpdate(JSON.parse(event.newValue) as Partial<State>)
      }
      window.addEventListener('storage', this.listener)
      const serializedState = window.localStorage.getItem(channelKey)
      if (serializedState)
        onUpdate(JSON.parse(serializedState) as Partial<State>)
    }

    return (state: State, updating = false) => {
      if (this.enabled) {
        if (!persist && stateChannel && !updating)
          stateChannel.postMessage(clone(state))
        if (persist && !updating)
          window.localStorage.setItem(channelKey, JSON.stringify(state))
      }
    }
  },
  disable() {
    this.enabled = false
    this.channels.forEach(channel => channel.close())
    if (this.listener) {
      window.removeEventListener('storage', this.listener)
    }
  },
}

// ============================================================================
// Sync Registry
// ============================================================================

const syncInterfaces: Sync[] = [builtinSync]
const channels = new Map<string, {
  onUpdate: (data: Partial<object>) => void
  persist?: boolean
  getSnapshot: () => object
}>()
const syncWrites: Record<string, SyncWrite<object>[]> = {}

/**
 * Disable builtin sync methods (BroadcastChannel + localStorage)
 */
export function disableBuiltinSync() {
  builtinSync.disable()
}

/**
 * Add a custom sync method (e.g., WebSocket)
 */
export function addSyncMethod(sync: Sync) {
  syncInterfaces.push(sync)
  // Initialize the new sync method for all existing channels
  for (const [channelKey, { onUpdate, persist, getSnapshot }] of channels.entries()) {
    // Use getSnapshot() to get current state, avoiding stale reference
    const write = sync.init(channelKey, onUpdate, getSnapshot(), persist)
    if (write) {
      syncWrites[channelKey].push(write)
    }
  }
}

// ============================================================================
// Create Sync State (React version)
// ============================================================================

export interface SyncStateResult<State extends object> {
  init: (channelKey: string) => void
  /** Subscribe to patch events. Returns unsubscribe function. */
  onPatch: (fn: (state: State) => void) => () => void
  onUpdate: (patch: Partial<State>) => void
  patch: <K extends keyof State>(key: K, value: State[K]) => void
  /** @deprecated Use getSnapshot() instead - this is for Vue compatibility only */
  readonly state: State
  subscribe: (callback: () => void) => () => void
  getSnapshot: () => State
}

/**
 * Create a synchronized state that syncs across presenter/viewer windows
 * React port of Slidev's createSyncState using external store pattern
 *
 * @param serverState - State from server (SSR)
 * @param defaultState - Default client state
 * @param persist - Whether to persist to localStorage
 */
export function createSyncState<State extends object>(
  serverState: State | ServerState<State>,
  defaultState: State,
  persist = false,
): SyncStateResult<State> {
  const onPatchCallbacks = new Set<(state: State) => void>()
  let patching = false
  let updating = false
  let patchingTimeout: ReturnType<typeof setTimeout>
  let updatingTimeout: ReturnType<typeof setTimeout>
  let writeQueued = false

  // Use server state if available, otherwise default
  const server = isServerState(serverState) ? serverState : undefined
  let state: State = hasServer
    ? { ...defaultState, ...(server?.getSnapshot() ?? serverState) }
    : { ...defaultState }

  // Subscribers for useSyncExternalStore
  const subscribers = new Set<() => void>()

  function notifySubscribers() {
    subscribers.forEach(cb => cb())
  }

  function subscribe(callback: () => void) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  function getSnapshot(): State {
    return state
  }

  function onPatch(fn: (state: State) => void): () => void {
    onPatchCallbacks.add(fn)
    return () => onPatchCallbacks.delete(fn)
  }

  function patch<K extends keyof State>(key: K, value: State[K]) {
    if (state[key] === value)
      return
    clearTimeout(patchingTimeout)
    clearTimeout(updatingTimeout)
    updating = false
    patching = true
    state = { ...state, [key]: value }
    notifySubscribers()
    // Navigation patches page/clicks/lastUpdate in one turn. Publish the whole
    // position together; intermediate BroadcastChannel messages can otherwise
    // pair the new page with the preceding page's clicks.
    if (!writeQueued) {
      writeQueued = true
      queueMicrotask(() => { writeQueued = false; onStateChanged?.() })
    }
    patchingTimeout = setTimeout(() => patching = false, 0)
  }

  function onUpdate(patchData: Partial<State>) {
    if (!patching) {
      clearTimeout(updatingTimeout)
      updating = true
      state = { ...state, ...patchData }
      notifySubscribers()
      onStateChanged?.()
      updatingTimeout = setTimeout(() => updating = false, 0)
    }
  }

  // Callback to notify sync writes when state changes
  let onStateChanged: (() => void) | null = null

  let initialized = false
  function init(channelKey: string) {
    if (initialized) return
    initialized = true
    if (hasServer) server?.subscribe(onUpdate)
    // Store getSnapshot instead of state to avoid stale reference
    channels.set(channelKey, { onUpdate, persist, getSnapshot })
    syncWrites[channelKey] = syncInterfaces
      .filter(sync => !hasServer || !server || sync !== builtinSync)
      .map(sync => sync.init<State>(channelKey, onUpdate, getSnapshot(), persist))
      .filter((x): x is SyncWrite<object> => Boolean(x))

    // Set up the state change callback
    onStateChanged = () => {
      // Use getSnapshot() to get current state, avoiding stale reference
      const currentState = getSnapshot()
      if (hasServer && !updating) server?.write(currentState)
      syncWrites[channelKey].forEach(write => write?.(clone(currentState), updating))
      if (!patching)
        onPatchCallbacks.forEach((fn: (state: State) => void) => fn(currentState))
    }
  }

  // Return object with getter for state to ensure current value is always returned
  return {
    init,
    onPatch,
    onUpdate,
    patch,
    get state() { return state },
    subscribe,
    getSnapshot,
  }
}
