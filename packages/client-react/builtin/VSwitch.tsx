/**
 * VSwitch component for React
 * Port of Vue client builtin/VSwitch.ts
 *
 * Switch between multiple content slots based on click state
 */

import type { ReactElement, ReactNode } from 'react'
import { recomputeAllPoppers } from 'floating-vue'
import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { CLASS_VCLICK_CURRENT, CLASS_VCLICK_DISPLAY_NONE, CLASS_VCLICK_PRIOR, CLASS_VCLICK_TARGET, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { useClicksValue } from '../hooks/useClicks'
import { resolveTransition } from '../logic/transition'
import { makeId } from '../logic/utils'
import { hmrSkipTransition } from '../state'

export interface VSwitchProps {
  at?: number | string
  unmount?: boolean
  transition?: object | string | false
  tag?: keyof JSX.IntrinsicElements
  childTag?: keyof JSX.IntrinsicElements
  children?: ReactNode
}

interface SlotContent {
  start: number
  end: number
  content: ReactNode
  key: string
}

export function VSwitch({
  at = '+1',
  unmount = false,
  transition = false,
  tag: Tag = 'div',
  childTag: ChildTag = 'div',
  children,
}: VSwitchProps) {
  const { $clicksContext: clicks, $nav: nav } = useSlideContext()
  const clicksValue = useClicksValue()
  const id = useRef(makeId())
  const registeredRef = useRef(false)

  // Parse slot entries from children
  const contents = useMemo(() => {
    const result: SlotContent[] = []
    let lastStart: number | undefined

    // Get children as array and sort by their range keys
    const childArray = Children.toArray(children) as ReactElement[]

    // Sort by range (descending order like Vue version)
    const sortedChildren = childArray
      .filter(child => isValidElement(child) && child.key)
      .sort((a, b) => {
        const aKey = String(a.key).replace(/^\.\$/, '')
        const bKey = String(b.key).replace(/^\.\$/, '')
        return -Number(aKey.split('-')[0]) + Number(bKey.split('-')[0])
      })

    for (const child of sortedChildren) {
      if (!isValidElement(child))
        continue

      const range = String(child.key).replace(/^\.\$/, '')

      if (Number.isFinite(+range)) {
        result.push({
          start: +range,
          end: lastStart ?? +range + 1,
          content: child.props.children ?? child,
          key: range,
        })
        lastStart = +range
      }
      else {
        const [start, end] = range.split('-').map(Number)
        if (!Number.isFinite(start) || !Number.isFinite(end))
          throw new Error(`Invalid range for v-switch: ${range}`)
        result.push({
          start,
          end,
          content: child.props.children ?? child,
          key: range,
        })
        lastStart = start
      }
    }

    return result
  }, [children])

  const size = useMemo(() => {
    if (contents.length === 0) return 0
    return Math.max(...contents.map(c => c.end)) - 1
  }, [contents])

  // Register clicks (Vue parity: onMounted)
  useEffect(() => {
    if (!clicks || registeredRef.current)
      return

    const clicksInfo = clicks.calculateSince(at, size)
    if (!clicksInfo) {
      return
    }

    clicks.register(id.current, clicksInfo)
    registeredRef.current = true

    return () => {
      clicks.unregister(id.current)
      registeredRef.current = false
    }
  }, [clicks, at, size])

  // Calculate offset from clicksValue (reactive)
  const offset = useMemo(() => {
    if (!clicks) return CLICKS_MAX

    const clicksInfo = clicks.calculateSince(at, size)
    if (!clicksInfo) return CLICKS_MAX

    return clicksValue - clicksInfo.start + 1
  }, [clicks, at, size, clicksValue])

  const onAfterLeave = () => {
    hmrSkipTransition.value = true
    recomputeAllPoppers()
  }

  const transitionProps = useMemo(() => {
    if (!transition)
      return null
    return resolveTransition(transition, nav?.value?.navDirection < 0)
  }, [transition, nav?.value?.navDirection])

  // Render children based on current offset (reactive via clicksValue)
  const visibleChildren = useMemo(() => {
    const result: ReactElement[] = []

    for (let i = contents.length - 1; i >= 0; i--) {
      const { start, end, content, key } = contents[i]
      const visible = start <= offset && offset < end

      if (unmount && !visible)
        continue

      const className = [
        CLASS_VCLICK_TARGET,
        offset === start && CLASS_VCLICK_CURRENT,
        offset >= end && CLASS_VCLICK_PRIOR,
        !visible && CLASS_VCLICK_DISPLAY_NONE,
      ].filter(Boolean).join(' ')

      result.push(
        <ChildTag
          key={key}
          className={className}
          data-slidev-clicks-start={start}
          data-slidev-clicks-end={end}
        >
          {content}
        </ChildTag>,
      )
    }

    return result
  }, [contents, offset, unmount, ChildTag])

  if (transitionProps && !hmrSkipTransition.value) {
    return (
      <TransitionGroup
        component={Tag}
        {...transitionProps}
        onExited={onAfterLeave}
      >
        {visibleChildren.map(child => (
          <CSSTransition
            key={child.key}
            timeout={300}
            classNames="slidev-vswitch"
          >
            {child}
          </CSSTransition>
        ))}
      </TransitionGroup>
    )
  }

  return <Tag>{visibleChildren}</Tag>
}

export default VSwitch
