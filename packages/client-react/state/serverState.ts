import { apply, randId, stringify } from 'vite-plugin-vue-server-ref/client'

export interface ServerState<State extends object> {
  readonly $serverState: true
  getSnapshot: () => State
  subscribe: (listener: (state: State) => void) => () => void
  write: (state: State) => void
}
export function isServerState<State extends object>(state: State | ServerState<State>): state is ServerState<State> {
  return '$serverState' in state && state.$serverState === true
}

export function getServerStateSnapshot<State extends object>(state: State | ServerState<State>): State {
  return isServerState(state) ? state.getSnapshot() : state
}

/** React client for the existing server-ref HTTP/HMR protocol. */
export function createServerState<State extends object>(key: string, initial: State): ServerState<State> {
  let snapshot = initial
  const source = randId()
  const listeners = new Set<(state: State) => void>()
  let timer: ReturnType<typeof setTimeout>
  const requests = new Set<AbortController>()
  let pageActive = true
  const stopPending = () => {
    pageActive = false
    clearTimeout(timer)
    requests.forEach(request => request.abort())
  }
  const resume = () => { pageActive = true }
  window.addEventListener('pagehide', stopPending)
  window.addEventListener('pageshow', resume)
  const receive = (payload: { key: string, source: string, data?: unknown, patch?: unknown }) => {
    if (payload.key !== key || payload.source === source) return
    const incoming: unknown = payload.patch ? apply(structuredClone(snapshot), payload.patch) : payload.data
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return
    // The virtual module and server share this key's canonical state schema.
    snapshot = incoming as State
    listeners.forEach(listener => listener(snapshot))
  }
  import.meta.hot?.on('vue-server-ref', receive)
  import.meta.hot?.dispose(() => {
    stopPending()
    window.removeEventListener('pagehide', stopPending)
    window.removeEventListener('pageshow', resume)
    import.meta.hot?.off('vue-server-ref', receive)
    listeners.clear()
  })
  return {
    $serverState: true,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    write(state) {
      snapshot = state
      if (!import.meta.hot || !pageActive) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const request = new AbortController()
        requests.add(request)
        void fetch(`${import.meta.env.BASE_URL}@server-reactive/${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: stringify({ source, data: snapshot, timestamp: Date.now() }),
          signal: request.signal,
        }).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`) })
          .catch(error => { if (!request.signal.aborted) console.error(`[Slidev] Could not synchronize ${key}`, error) })
          .finally(() => requests.delete(request))
      }, 10)
    },
  }
}
