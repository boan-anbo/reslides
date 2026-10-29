/**
 * SlideCurrentNo component for React
 * Port of Vue client builtin/SlideCurrentNo.vue
 *
 * Displays the current slide number.
 */

import { useSlideContext } from '../context'

export function SlideCurrentNo() {
  const { $page } = useSlideContext()
  return <span>{$page}</span>
}

export default SlideCurrentNo
