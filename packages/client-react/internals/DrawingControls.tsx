/**
 * DrawingControls component for React
 * Port of Vue client internals/DrawingControls.vue
 *
 * Provides drawing toolbar UI for slide annotations.
 */

import { useCallback } from 'react'
import { useDrawings } from '../hooks/useDrawings'
import { IconButton } from './IconButton'
import './DrawingControls.css'

export function DrawingControls() {
  const {
    brush,
    brushColors,
    canClear,
    canRedo,
    canUndo,
    clear,
    drauu,
    drawingEnabled,
    drawingMode,
    drawingPinned,
    setDrawingEnabled,
    setDrawingPinned,
    setDrawingMode,
    setBrush,
  } = useDrawings()

  const handleUndo = useCallback(() => drauu?.undo(), [drauu])
  const handleRedo = useCallback(() => drauu?.redo(), [drauu])

  if (!drawingEnabled) return null

  return (
    <div className={`slidev-drawing-controls ${drawingPinned ? 'pinned' : ''}`}>
      <div className="flex items-center gap-1 p-2 bg-main rounded-md shadow border border-main">
        {/* Drawing mode buttons */}
        <IconButton
          title="Stylus"
          className={drawingMode === 'stylus' ? 'active' : ''}
          onClick={() => setDrawingMode('stylus')}
        >
          <div className="i-carbon:pen" />
        </IconButton>
        <IconButton
          title="Line"
          className={drawingMode === 'line' ? 'active' : ''}
          onClick={() => setDrawingMode('line')}
        >
          <div className="i-carbon:subtract" />
        </IconButton>
        <IconButton
          title="Arrow"
          className={drawingMode === 'arrow' ? 'active' : ''}
          onClick={() => setDrawingMode('arrow')}
        >
          <div className="i-carbon:arrow-up-right" />
        </IconButton>
        <IconButton
          title="Rectangle"
          className={drawingMode === 'rectangle' ? 'active' : ''}
          onClick={() => setDrawingMode('rectangle')}
        >
          <div className="i-carbon:checkbox" />
        </IconButton>
        <IconButton
          title="Ellipse"
          className={drawingMode === 'ellipse' ? 'active' : ''}
          onClick={() => setDrawingMode('ellipse')}
        >
          <div className="i-carbon:radio-button" />
        </IconButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Color picker */}
        {brushColors.map(color => (
          <button
            key={color}
            className={`w-6 h-6 rounded-full border-2 ${brush.color === color ? 'border-primary' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
            onClick={() => setBrush({ color })}
            title={color}
          />
        ))}

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Actions */}
        <IconButton
          title="Undo"
          className={canUndo ? '' : 'opacity-30'}
          onClick={handleUndo}
        >
          <div className="i-carbon:undo" />
        </IconButton>
        <IconButton
          title="Redo"
          className={canRedo ? '' : 'opacity-30'}
          onClick={handleRedo}
        >
          <div className="i-carbon:redo" />
        </IconButton>
        <IconButton
          title="Clear"
          className={canClear ? '' : 'opacity-30'}
          onClick={clear}
        >
          <div className="i-carbon:trash-can" />
        </IconButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Pin/Close */}
        <IconButton
          title={drawingPinned ? 'Unpin' : 'Pin toolbar'}
          onClick={() => setDrawingPinned(!drawingPinned)}
        >
          <div className={drawingPinned ? 'i-carbon:pin-filled' : 'i-carbon:pin'} />
        </IconButton>
        <IconButton title="Close drawing" onClick={() => setDrawingEnabled(false)}>
          <div className="i-carbon:close" />
        </IconButton>
      </div>
    </div>
  )
}
