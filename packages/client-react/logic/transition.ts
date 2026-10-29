import type { SlideRoute } from '@slidev/types'
import type { TransitionGroupProps } from '../hooks/useTransition'
import type { SlidevRouteMeta } from '../shim'
import { configs } from '../env'

// Helper type for typed meta access
type TypedSlideRoute = SlideRoute & { meta: SlidevRouteMeta }

/**
 * Transition resolution map
 * Maps single transition names to forward|backward pairs
 */
const transitionResolveMap: Record<string, string | undefined> = {
  'slide-left': 'slide-left | slide-right',
  'slide-right': 'slide-right | slide-left',
  'slide-up': 'slide-up | slide-down',
  'slide-down': 'slide-down | slide-up',
}

/**
 * Resolve transition from string or object
 * 1:1 port from Slidev packages/client/logic/transition.ts
 */
export function resolveTransition(
  transition?: string | TransitionGroupProps,
  isBackward = false,
): TransitionGroupProps | undefined {
  if (!transition)
    return undefined

  if (typeof transition === 'string') {
    transition = {
      name: transition,
    }
  }

  if (!transition.name)
    return undefined

  let name = transition.name.includes('|')
    ? transition.name
    : (transitionResolveMap[transition.name] || transition.name)

  if (name.includes('|')) {
    const [forward, backward] = name.split('|').map(i => i.trim())
    name = isBackward ? backward : forward
  }

  if (!name)
    return undefined

  return {
    ...transition,
    name,
  }
}

/**
 * Get current transition based on navigation direction
 * 1:1 port from Slidev packages/client/logic/transition.ts
 *
 * Logic:
 * - Forward (direction > 0): use prevRoute's transition
 * - Backward (direction < 0): use currentRoute's transition
 * - Fallback to configs.transition
 */
export function getCurrentTransition(
  direction: number,
  currentRoute?: SlideRoute,
  prevRoute?: SlideRoute,
): TransitionGroupProps | undefined {
  const typedCurrent = currentRoute as TypedSlideRoute | undefined
  const typedPrev = prevRoute as TypedSlideRoute | undefined

  let transition: string | TransitionGroupProps | undefined = direction > 0
    ? typedPrev?.meta?.transition
    : typedCurrent?.meta?.transition

  if (!transition)
    transition = configs.transition as string | TransitionGroupProps | undefined

  return resolveTransition(transition, direction < 0)
}
