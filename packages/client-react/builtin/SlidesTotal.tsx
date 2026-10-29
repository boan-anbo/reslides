/**
 * SlidesTotal component for React
 * Port of Vue client builtin/SlidesTotal.vue
 *
 * Displays the total number of slides.
 */

import { useSlideContext } from '../context'

export function SlidesTotal() {
  const { $nav } = useSlideContext()
  return <span>{$nav.total}</span>
}

export default SlidesTotal
