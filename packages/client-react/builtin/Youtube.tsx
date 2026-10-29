/**
 * Youtube component for React
 * Port of Vue client builtin/Youtube.vue
 *
 * A simple wrapper for embedded YouTube videos.
 *
 * Usage:
 * <Youtube id="luoMHjh-XcQ" />
 */

export interface YoutubeProps {
  id: string
  width?: number
  height?: number
}

export function Youtube({ id, width, height }: YoutubeProps) {
  return (
    <iframe
      className="youtube"
      width={width}
      height={height}
      src={`https://www.youtube.com/embed/${id}`}
      title="YouTube"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

export default Youtube
