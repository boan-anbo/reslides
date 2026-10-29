/** A floating menu around an existing button; no nested native buttons. */
import type { ReactNode } from 'react'
import { autoUpdate, flip, FloatingPortal, offset, shift, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react'
import { useState } from 'react'

export interface MenuButtonProps { disabled?: boolean, button: ReactNode, menu: ReactNode }
export function MenuButton({ disabled = false, button, menu }: MenuButtonProps) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top-start',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const click = useClick(context, { enabled: !disabled, keyboardHandlers: false })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])
  return (
    <>
      <div ref={refs.setReference} className="flex" {...getReferenceProps()}>{button}</div>
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} className="bg-main text-main shadow-xl z-menu py-2 border border-main rounded-md max-h-[calc(100vh-1rem)] overflow-auto" {...getFloatingProps()}>
            {menu}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
