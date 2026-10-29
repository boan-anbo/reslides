/**
 * Entry Page for React
 * Port of Vue client pages/entry.vue
 */

import { Link } from 'react-router-dom'
import './EntryPage.css'

export function EntryPage() {
  return (
    <div className="h-full w-full flex items-center justify-center gap-5 lt-md:flex-col">
      <Link to="/" className="entry-page-link">
        <div className="i-carbon:presentation-file" /> Slides
      </Link>
      <Link to="/presenter" className="entry-page-link">
        <div className="i-carbon:user-speaker" /> Presenter
      </Link>
      <Link to="/notes" className="entry-page-link">
        <div className="i-carbon:catalog" /> Notes
      </Link>
      <Link to="/overview" className="entry-page-link">
        <div className="i-carbon:list-boxes" /> Overview
      </Link>
    </div>
  )
}

export default EntryPage
