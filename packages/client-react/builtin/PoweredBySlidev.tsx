/**
 * PoweredBySlidev component for React
 * Port of Vue client builtin/PoweredBySlidev.vue
 *
 * Displays "Powered by Slidev" badge.
 */

export function PoweredBySlidev() {
  return (
    <span className="inline-flex items-center">
      <span className="text-main">Powered by</span>
      <a href="https://sli.dev" className="!border-none">
        <img
          alt="Slidev logo"
          src={new URL('../assets/logo-title-horizontal.png', import.meta.url).href}
          className="h-1.5em"
        />
      </a>
    </span>
  )
}

export default PoweredBySlidev
