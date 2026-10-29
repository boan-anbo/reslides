/**
 * VClick component for React
 * Port of Vue client builtin/VClick.ts
 *
 * <v-click/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 */

import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement, useMemo } from 'react'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  CLICKS_MAX,
} from '../constants'
import { useClickVisibility } from '../hooks/useClicks'
import { VClicks } from './VClicks'

export interface VClickProps {
  at?: number | string
  hide?: boolean
  fade?: boolean
  children?: ReactNode
}

/**
 * VClick component - wraps children in click-activated visibility
 * Uses VClicks with every=CLICKS_MAX to apply click to all children at once
 */
export function VClick({
  at = '+1',
  hide = false,
  fade = false,
  children,
}: VClickProps) {
  // Use VClicks with every=CLICKS_MAX (Vue parity)
  return (
    <VClicks
      every={CLICKS_MAX}
      at={at}
      hide={hide}
      fade={fade}
      handleSpecialElements={false}
    >
      {children}
    </VClicks>
  )
}

/**
 * VClickSingle - simplified single-element click wrapper using hooks directly
 * Use this for simple cases where VClicks overhead isn't needed
 */
export function VClickSingle({
  at = '+1',
  hide = false,
  fade = false,
  children,
}: VClickProps) {
  const {
    isActive,
    isCurrent,
    isPrior,
    start,
    end,
  } = useClickVisibility(at, hide, fade)

  // Build class string
  const classNames = useMemo(() => {
    const classes = [CLASS_VCLICK_TARGET]

    if (hide) {
      if (isActive) {
        classes.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
        classes.push(CLASS_VCLICK_HIDDEN_EXP)
      }
    }
    else {
      if (!isActive) {
        classes.push(fade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN)
      }
    }

    if (isCurrent)
      classes.push(CLASS_VCLICK_CURRENT)
    if (isPrior)
      classes.push(CLASS_VCLICK_PRIOR)

    return classes.join(' ')
  }, [hide, fade, isActive, isCurrent, isPrior])

  // Clone children and add classes
  const processedChildren = useMemo(() => {
    return Children.map(children, (child) => {
      if (!isValidElement(child))
        return <span className={classNames}>{child}</span>

      const existingClassName = (child.props as { className?: string }).className || ''
      const newClassName = existingClassName ? `${existingClassName} ${classNames}` : classNames

      const dataProps: Record<string, string> = {
        'data-slidev-clicks-start': String(start),
      }
      if (Number.isFinite(end)) {
        dataProps['data-slidev-clicks-end'] = String(end)
      }

      return cloneElement(child as ReactElement, {
        className: newClassName,
        ...dataProps,
      })
    })
  }, [children, classNames, start, end])

  return <>{processedChildren}</>
}

// VAfter - equivalent to v-click="+0"
export interface VAfterProps {
  hide?: boolean
  fade?: boolean
  children?: ReactNode
}

export function VAfter({ hide = false, fade = false, children }: VAfterProps) {
  return (
    <VClick at="+0" hide={hide} fade={fade}>
      {children}
    </VClick>
  )
}

// VClickHide - equivalent to v-click with hide=true
export interface VClickHideProps {
  at?: number | string
  fade?: boolean
  children?: ReactNode
}

export function VClickHide({ at = '+1', fade = false, children }: VClickHideProps) {
  return (
    <VClick at={at} hide fade={fade}>
      {children}
    </VClick>
  )
}

export default VClick
