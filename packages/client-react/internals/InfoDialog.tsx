/**
 * InfoDialog component for React
 * Port of Vue client internals/InfoDialog.vue
 */

import { useMemo } from 'react'
import { configs } from '../env'
import { Modal } from './Modal'
import './InfoDialog.css'

export interface InfoDialogProps {
  open: boolean
  onClose: () => void
}

export function InfoDialog({ open, onClose }: InfoDialogProps) {
  const hasInfo = useMemo(() => typeof configs.info === 'string', [])

  return (
    <Modal open={open} onClose={onClose} className="px-6 py-4">
      <div className="slidev-info-dialog slidev-layout flex flex-col gap-4 text-base">
        {hasInfo && (
          <div
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: configs.info as string }}
          />
        )}
        <a
          href="https://github.com/slidevjs/slidev"
          target="_blank"
          rel="noreferrer"
          className="!opacity-100 !border-none !text-current"
        >
          <div className="flex gap-1 items-center">
            <div className="opacity-50 text-sm mr-2">Powered by</div>
            <img
              className="w-5 h-5"
              src="/assets/logo.png"
              alt="Slidev logo"
            />
            <div style={{ color: '#2082A6' }}>
              <b>Sli</b>dev
            </div>
          </div>
        </a>
      </div>
    </Modal>
  )
}
