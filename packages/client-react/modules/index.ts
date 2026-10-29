/**
 * React client modules
 * Port of Vue client modules with React equivalents
 */

// Context types
export type { SlidevContext } from './context'

// v-click
export {
  resolvedClickMap,
  useVAfter,
  useVClick,
  useVClickHide,
} from './v-click'
export type {
  VClickOptions,
  VClickProps,
  VClickResult,
} from './v-click'

// v-drag
export {
  createVDragDirective,
  useVDrag,
} from './v-drag'
export type {
  DragElementState,
  UseDragOptions,
  UseDragResult,
} from './v-drag'

// v-mark
export {
  applyModifiers,
  createVMarkDirective,
  useVMark,
} from './v-mark'
export type {
  RoughDirectiveOptions,
  RoughDirectiveValue,
  UseVMarkOptions,
  UseVMarkResult,
} from './v-mark'

// v-motion
export {
  createVMotionDirectives,
  useVMotion,
} from './v-motion'
export type {
  MotionVariant,
  UseVMotionOptions,
  UseVMotionResult,
} from './v-motion'

// Mermaid
export { renderMermaid } from './mermaid'
