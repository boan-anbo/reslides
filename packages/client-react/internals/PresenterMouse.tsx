/**
 * PresenterMouse component for React
 * Port of Vue client internals/PresenterMouse.vue
 *
 * Shows the presenter's mouse cursor position on viewer screens, driven by
 * sharedState.cursor (synced across windows; the Presenter page patches it
 * on mousemove). A previous version kept its own module-local position
 * state that nothing ever wrote to.
 */

import { useSharedState } from '../state/shared'

export function PresenterMouse() {
  const [shared] = useSharedState()
  const cursor = shared.cursor

  if (!cursor) return null

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none text-xl">
      <div
        className="absolute i-ph:cursor-fill stroke-white dark:stroke-black"
        style={{
          left: `${cursor.x}%`,
          top: `${cursor.y}%`,
          strokeWidth: 16,
        }}
      />
    </div>
  )
}
