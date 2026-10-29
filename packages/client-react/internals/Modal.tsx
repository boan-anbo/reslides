/**
 * Modal component for React
 * Port of Vue client internals/Modal.vue
 */

import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  className?: string
  children?: ReactNode
}

export function Modal({
  open,
  onClose,
  className = '',
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 grid z-modal">
      <div
        className="absolute top-0 bottom-0 left-0 right-0 -z-1 bg-black/80"
        onClick={onClose}
      />
      <div
        className={`m-auto rounded-md bg-main shadow dark:border dark:border-main ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
