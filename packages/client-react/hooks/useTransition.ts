/**
 * Transition types shared by logic/transition.ts, useNav and shim.d.ts.
 *
 * The former framer-motion-style inline transition table that lived here
 * was never wired up and duplicated packages/client/styles/transitions.css;
 * slide transitions are CSS-class driven via hooks/useSlideTransition.ts.
 */

export interface TransitionGroupProps {
  name?: string
  mode?: 'out-in' | 'in-out' | 'default'
  duration?: number
}
