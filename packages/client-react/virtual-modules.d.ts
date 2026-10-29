declare module '#slidev/setups/monaco' {
  const setups: import('@slidev/types').MonacoSetup[]
  export default setups
}
declare module '#slidev/setups/shiki' {
  const setups: import('@slidev/types').ShikiSetup[]
  export default setups
}
declare module '#slidev/setups/code-runners' {
  const setups: import('@slidev/types').CodeRunnersSetup[]
  export default setups
}
declare module '#slidev/monaco-types' {}
declare module '#slidev/monaco-run-deps' {
  const deps: Record<string, unknown>
  export default deps
}
declare module '#slidev/setups/main' {
  const setups: import('./setups').AppSetup[]
  export default setups
}
declare module '#slidev/setups/root' {
  const setups: import('./setups').RootSetup[]
  export default setups
}
declare module '#slidev/setups/routes' {
  const setups: import('./setups').RoutesSetup[]
  export default setups
}
declare module '#slidev/setups/shortcuts' {
  const setups: import('./setups').ShortcutsSetup[]
  export default setups
}
declare module '#slidev/setups/context-menu' {
  const setups: import('./setups').ContextMenuSetup[]
  export default setups
}
declare module 'server-reactive:nav' {
  const state: import('./state/serverState').ServerState<import('./state/shared').SharedState>
  export default state
}
declare module 'server-reactive:drawings?diff' {
  const state: import('./state/serverState').ServerState<import('./state/drawings').DrawingsState>
  export default state
}
declare module 'server-reactive:snapshots?diff' {
  const state: import('./state/serverState').ServerState<import('./state/snapshot').SnapshotState>
  export default state
}
declare module '#slidev/configs' {
  const configs: import('@slidev/types').SlidevClientConfig
  export default configs
}
declare module '#slidev/slides' {
  const slides: (import('@slidev/types').SlideRoute & { meta: import('./shim').SlidevRouteMeta })[]
  export default slides
}
declare module '#slidev/global-layers' {
  export const GlobalTop: import('react').ComponentType
  export const GlobalBottom: import('react').ComponentType
  export const SlideTop: import('react').ComponentType
  export const SlideBottom: import('react').ComponentType
}
declare module '#slidev/setups/mermaid' {
  const setups: import('@slidev/types').MermaidSetup[]
  export default setups
}
