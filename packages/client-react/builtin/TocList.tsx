/**
 * TocList component for React
 * Port of Vue client builtin/TocList.vue
 *
 * TOC list
 * (used by Toc component, you don't need to use this component directly)
 */

import type { TocItem } from '@slidev/types'
import { toArray } from '@antfu/utils'
import { useMemo } from 'react'
import { Link } from './Link'
import { useNav } from '../hooks/useNav'
import './TocList.css'

export interface TocListProps {
  level?: number
  start?: string | number
  listStyle?: string | string[]
  list: TocItem[]
  listClass?: string | string[]
}

export function TocList({
  level = 1,
  start,
  listStyle,
  list,
  listClass,
}: TocListProps) {
  const { isPresenter } = useNav()

  const classes = useMemo(() => {
    return [
      ...toArray(listClass || []),
      'slidev-toc-list',
      `slidev-toc-list-level-${level}`,
    ].join(' ')
  }, [listClass, level])

  const styles = useMemo(() => toArray(listStyle || []), [listStyle])

  const style = useMemo(() => {
    if (styles.length >= level) {
      return { listStyle: styles[level - 1] }
    }
    return undefined
  }, [styles, level])

  if (!list || list.length === 0) {
    return null
  }

  return (
    <ol
      className={classes}
      start={level === 1 ? Number(start) : undefined}
      style={style}
    >
      {list.map(item => (
        <li
          key={item.path}
          className={`slidev-toc-item ${item.active ? 'slidev-toc-item-active' : ''} ${item.activeParent ? 'slidev-toc-item-parent-active' : ''}`}
        >
          <Link to={isPresenter.value ? `/presenter${item.path}` : item.path}>
            {/* TitleRenderer would go here - simplified for now */}
            <span>Slide {item.no}</span>
          </Link>
          {item.children.length > 0 && (
            <TocList
              level={level + 1}
              listStyle={listStyle}
              list={item.children}
              listClass={listClass}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

export default TocList
