/**
 * ExportPdfTip component for React
 * Port of Vue client internals/ExportPdfTip.vue
 *
 * Modal shown before opening the browser print dialog, with the
 * "don't show again" preference (skipExportPdfTip).
 */
import { useSyncExternalStore } from 'react'
import { skipExportPdfTip, subscribeStorage } from '../state/storage'
import { Modal } from './Modal'

export interface ExportPdfTipProps {
  open: boolean
  onClose: () => void
  onPrint: () => void
}

export function ExportPdfTip({ open, onClose, onPrint }: ExportPdfTipProps) {
  const skip = useSyncExternalStore(subscribeStorage, () => skipExportPdfTip.value, () => false)

  function print() {
    onClose()
    onPrint()
  }

  return (
    <Modal open={open} onClose={onClose} className="px-6 py-4 flex flex-col gap-2">
      <div className="flex gap-2 text-xl">
        <div className="i-carbon:information my-auto" />
        {' '}
        Tips
      </div>
      <div>
        Slidev will open your browser's built-in print dialog to export the slides as PDF.
        <br />
        In the print dialog, please:
        <ul className="list-disc my-4 pl-4">
          <li>
            Choose "Save as PDF" as the Destination.
            <span className="op-70 text-xs"> (Not "Microsoft Print to PDF") </span>
          </li>
          <li> Choose "Default" as the Margin. </li>
          <li> Toggle on "Print backgrounds". </li>
        </ul>
        <div className="mb-2 op-70 text-sm">
          If you're encountering problems, please try
          {' '}
          <a href="https://sli.dev/builtin/cli#export"> the CLI </a>
          {' '}
          or
          {' '}
          <a href="https://github.com/slidevjs/slidev/issues/new"> open an issue</a>
          .
        </div>
        <div className="form-check op-70">
          <input
            name="skip-pdf-tip"
            type="checkbox"
            checked={skip}
            onChange={e => { skipExportPdfTip.value = e.target.checked }}
          />
          <label htmlFor="skip-pdf-tip" onClick={() => { skipExportPdfTip.value = !skipExportPdfTip.value }}>
            Don't show this dialog next time.
          </label>
        </div>
      </div>
      <div className="flex my-1">
        <button className="slidev-form-button cancel" onClick={onClose}>
          Cancel
        </button>
        <div className="flex-auto" />
        <button className="slidev-form-button primary" onClick={print}>
          Start
        </button>
      </div>
    </Modal>
  )
}

export default ExportPdfTip
