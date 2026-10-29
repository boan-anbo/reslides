/**
 * VClicks component for React
 * Port of Vue client builtin/VClicks.ts
 *
 * <v-clicks/> click animations component
 *
 * Learn more: https://sli.dev/guide/animations.html#click-animation
 *
 * Port note: Vue assigns each item a RELATIVE click value and relies on
 * directive mount order (children before parents) for the offsets to add
 * up. React renders parents first, so that arithmetic cannot be ported
 * 1:1. Instead the group resolves its base offset once (synchronously, at
 * first render), assigns every wrapped item an ABSOLUTE click index, and
 * registers a single group-level relative delta so that elements after
 * the group keep resolving correctly. The observable click sequence is
 * identical: item g (1-based, in Vue's traversal order) becomes visible at
 * base + ceil(g / every) - 1.
 */

import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement, useContext, useId, useLayoutEffect, useMemo, useState } from 'react'
import {
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_FADE,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_HIDDEN_EXP,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
} from '../constants'
import { ClicksContextContext } from '../context'
import { normalizeSingleAtValue, useClicksInfo } from '../hooks/useClicks'

const listTags = ['ul', 'ol']

export interface VClicksProps {
  depth?: number | string
  every?: number | string
  at?: number | string
  hide?: boolean
  fade?: boolean
  handleSpecialElements?: boolean
  children?: ReactNode
}

/**
 * Internal component applying click visibility to a single child.
 * `at` is an absolute click index (see port note above), or null while the
 * group's base offset is still resolving (renders as not-yet-active).
 */
function ClickWrapper({
  at,
  hide,
  fade,
  children,
}: {
  at: number | null
  hide: boolean
  fade: boolean
  children: ReactElement
}) {
  // at=null (pending base): pass `false` so no click info is registered yet
  const { start, end, isActive: rawActive, isCurrent: rawCurrent } = useClicksInfo(at ?? false)
  const isActive = at == null ? false : rawActive
  const isCurrent = at == null ? false : rawCurrent
  const isPrior = isActive && !isCurrent

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

  const existingClassName = (children.props as { className?: string }).className || ''
  const newClassName = existingClassName ? `${existingClassName} ${classNames}` : classNames

  const dataProps: Record<string, string | number> = {
    'data-slidev-clicks-start': start,
  }
  if (Number.isFinite(end)) {
    dataProps['data-slidev-clicks-end'] = end
  }

  return cloneElement(children, {
    className: newClassName,
    ...dataProps,
  })
}

/** Flatten fragments into a flat element list (Vue: openAllTopLevelSlots). */
function flattenChildren(nodes: ReactNode): ReactNode[] {
  const result: ReactNode[] = []
  Children.forEach(nodes, (child) => {
    if (
      isValidElement(child)
      && child.type === Symbol.for('react.fragment')
      && (child.props as { children?: ReactNode }).children
    ) {
      result.push(...flattenChildren((child.props as { children?: ReactNode }).children))
    }
    else {
      result.push(child)
    }
  })
  return result
}

export function VClicks({
  depth = 1,
  every = 1,
  at = '+1',
  hide = false,
  fade = false,
  handleSpecialElements = true,
  children,
}: VClicksProps) {
  const clicksContext = useContext(ClicksContextContext)
  const everyNum = +every || 1
  const atValue = normalizeSingleAtValue(at)
  const isRelative = typeof atValue === 'string'

  const groupId = useId()

  // Resolve the group's base click index at COMMIT time (layout effect):
  // relative values resolve against currentOffset, which is only correct
  // once all earlier elements have committed their registrations (see the
  // rationale in hooks/useClicks.ts useClicksInfo). Until resolved,
  // children render in the not-yet-active state (at=null), and the
  // pre-paint setState re-render applies the real indices.
  const [base, setBase] = useState<number | null>(
    // absolute `at` needs no offset resolution - available immediately
    atValue != null && !isRelative ? +atValue : null,
  )

  const result = useMemo(() => {
    if (atValue == null || !children)
      return { tree: children, totalItems: 0 }

    let globalIdx = 1
    // 1-based click ordinal within the group (Vue: ceil(globalIdx / every)).
    // Always advances the counter so totalItems is correct even while the
    // base is still resolving (children render with at=null meanwhile).
    const clickAt = () => {
      const ordinal = Math.ceil(globalIdx++ / everyNum)
      return base == null ? null : base + ordinal - 1
    }

    const wrap = (element: ReactElement, atAbs: number | null, key: number | string) => (
      <ClickWrapper key={key} at={atAbs} hide={hide} fade={fade}>
        {element}
      </ClickWrapper>
    )

    // Vue mapChildren: wrap each item; if depth allows, recurse into the
    // item's children looking for nested lists (mapSubList).
    const mapChildren = (nodes: ReactNode[], currentDepth = 1): ReactNode[] => {
      return nodes.map((child, index) => {
        if (!isValidElement(child))
          return child

        const thisAt = clickAt()

        let processedChild = child
        const childChildren = (child.props as { children?: ReactNode }).children
        if (currentDepth < +depth && childChildren) {
          processedChild = cloneElement(child as ReactElement<{ children?: ReactNode }>, {
            children: mapSubList(flattenChildren(childChildren), currentDepth),
          })
        }

        return wrap(processedChild, thisAt, index)
      })
    }

    // Vue mapSubList: walk an item's children; nested ul/ol get their
    // items processed by mapChildren at depth + 1.
    const mapSubList = (nodes: ReactNode[], currentDepth = 1): ReactNode[] => {
      return nodes.map((child, index) => {
        if (!isValidElement(child))
          return child

        const childType = typeof child.type === 'string' ? child.type : ''
        const childChildren = (child.props as { children?: ReactNode }).children
        if (listTags.includes(childType) && childChildren) {
          return cloneElement(child as ReactElement<{ children?: ReactNode }>, {
            key: index,
            children: mapChildren(flattenChildren(childChildren), currentDepth + 1),
          })
        }

        return cloneElement(child, { key: index })
      })
    }

    const elements = flattenChildren(children).filter(n => n != null && n !== '' && !(typeof n === 'string' && !n.trim()))

    let tree: ReactNode

    if (handleSpecialElements && elements.length === 1 && isValidElement(elements[0])) {
      const firstElement = elements[0] as ReactElement<{ children?: ReactNode }>
      const firstType = typeof firstElement.type === 'string' ? firstElement.type : ''

      if (listTags.includes(firstType) && firstElement.props.children) {
        tree = cloneElement(firstElement, {
          children: mapChildren(flattenChildren(firstElement.props.children)),
        })
      }
      else if (firstType === 'table' && firstElement.props.children) {
        tree = cloneElement(firstElement, {
          children: flattenChildren(firstElement.props.children).map((tableChild, idx) => {
            if (!isValidElement(tableChild))
              return tableChild
            const tableChildType = typeof tableChild.type === 'string' ? tableChild.type : ''
            const tbodyChildren = (tableChild.props as { children?: ReactNode }).children
            if (tableChildType === 'tbody' && tbodyChildren) {
              return cloneElement(tableChild as ReactElement<{ children?: ReactNode }>, {
                key: idx,
                children: mapChildren(flattenChildren(tbodyChildren)),
              })
            }
            return cloneElement(tableChild, { key: idx })
          }),
        })
      }
    }

    if (tree === undefined)
      tree = <>{mapChildren(elements)}</>

    return { tree, totalItems: globalIdx - 1 }
  }, [children, atValue, everyNum, depth, hide, fade, handleSpecialElements, base])

  // Resolve the base and register the group's click span at COMMIT time
  // (layout effect, pre-paint), replacing Vue's per-item deltas +
  // VClickGap. Only relative groups contribute to the running offset -
  // absolute groups contribute 0 in Vue as well. Cleanup unregisters, so a
  // remount resolves fresh (deletion cleanup runs before the replacement
  // tree's layout effects within a commit).
  const totalItems = result.totalItems
  useLayoutEffect(() => {
    if (!clicksContext || atValue == null || totalItems === 0)
      return
    const resolvedBase = isRelative ? clicksContext.currentOffset + +atValue : +atValue
    setBase(resolvedBase)
    const groupClicks = Math.ceil(totalItems / everyNum)
    clicksContext.register(groupId, {
      delta: isRelative ? +atValue + groupClicks - 1 : 0,
      max: resolvedBase + groupClicks - 1,
    })
    return () => {
      clicksContext.unregister(groupId)
    }
    // atValue/everyNum changing post-mount is not supported (Vue resolves
    // once at directive mount as well).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clicksContext, totalItems, groupId])

  return <>{result.tree}</>
}

export default VClicks
