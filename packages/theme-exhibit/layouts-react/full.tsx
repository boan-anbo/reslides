import type { ReactNode } from 'react'

/** Blank exhibit page: theme fonts and colours, no top line, no padding. Use for full-bleed images or custom pages. */
export default function FullLayout({ class: className, layoutClass, children, slots }: { class?: string, layoutClass?: string, children?: ReactNode, slots?: Record<string, ReactNode> }) {
  return (
    <div className={`dh full ${layoutClass || ''} ${className || ''}`} style={{ padding: 0 }}>
      {slots?.default ?? children}
    </div>
  )
}
