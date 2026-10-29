import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'

// ============================================================================
// Slot Types for React Layouts
// ============================================================================

/**
 * Props for layout components
 * Slots are pre-parsed by node transform (slot-sugar.ts) in Phase B
 * React layouts only consume the already-structured slots
 */
export interface SlotProps {
  /** Default slot content */
  children?: ReactNode
  /** Named slot contents (parsed at build time by node transform) */
  slots?: Record<string, ReactNode>
}

export interface LayoutProps extends SlotProps {
  /** Layout class from frontmatter */
  class?: string
  layoutClass?: string
  /** Full frontmatter object */
  frontmatter?: Record<string, any>
}

/**
 * Props for SlotMarker component
 * Used by node transform to mark slot boundaries
 */
export interface SlotMarkerProps {
  name: string
  children?: ReactNode
}

// ============================================================================
// SlotMarker Component
// ============================================================================

/**
 * Marker component for named slots
 * Used by node transform (slot-sugar-react.ts) to wrap slot content
 * Then extracted by extractSlots() to build the slots object
 */
export function SlotMarker({ children }: SlotMarkerProps): ReactElement {
  // SlotMarker renders its children directly
  // The slot extraction happens in extractSlots()
  return <>{children}</>
}

// Marker to identify SlotMarker elements
SlotMarker.displayName = 'SlotMarker'

// ============================================================================
// Slot Extraction
// ============================================================================

/**
 * Extract named slots from children containing SlotMarker components
 * Used by layout wrapper to convert SlotMarker tree into slots object
 */
export function extractSlots(children: ReactNode): Record<string, ReactNode> {
  const slots: Record<string, ReactNode> = {}

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SlotMarker) {
      const props = child.props as SlotMarkerProps
      const slotName = props.name || 'default'
      slots[slotName] = props.children
    }
    else if (child != null && child !== false) {
      // Non-SlotMarker content goes to default slot
      if (!slots.default) {
        slots.default = child
      }
      else if (Array.isArray(slots.default)) {
        (slots.default as ReactNode[]).push(child)
      }
      else {
        slots.default = [slots.default, child]
      }
    }
  })

  return slots
}

// ============================================================================
// Slot Utilities (consume pre-parsed slots)
// ============================================================================

/**
 * Get slot content by name
 * Note: Slots are parsed at build time by node transform (slot-sugar.ts)
 * This function only retrieves pre-parsed slot content
 */
export function getSlot(slots: Record<string, ReactNode> | undefined, name: string): ReactNode {
  return slots?.[name] ?? null
}

/**
 * Check if a slot exists and has content
 */
export function hasSlot(slots: Record<string, ReactNode> | undefined, name: string): boolean {
  return !!slots?.[name]
}

// ============================================================================
// Frontmatter to Props Conversion
// ============================================================================

/**
 * Convert frontmatter to layout props
 * Parallel to Vue's frontmatterToProps in @slidev/client/context.ts
 */
export function frontmatterToProps(
  frontmatter: Record<string, any> | undefined,
  slideIndex: number,
): Record<string, any> {
  if (!frontmatter) return {}

  const props: Record<string, any> = {}

  // Copy all frontmatter except reserved keys
  const reserved = ['layout', 'class', 'transition', 'clicks', 'disabled', 'hide', 'hideInToc', 'level', 'title', 'name', 'preload', 'src', 'routeAlias']

  for (const [key, value] of Object.entries(frontmatter)) {
    if (!reserved.includes(key)) {
      props[key] = value
    }
  }

  // Add class if present
  if (frontmatter.class) {
    props.layoutClass = frontmatter.class
  }

  // Add slide number for layouts that need it
  props.slideNo = slideIndex + 1

  return props
}

// ============================================================================
// Layout Resolution
// ============================================================================

/**
 * Resolve layout component by name
 * Returns the layout component or default layout
 */
export function resolveLayout(
  layouts: Record<string, React.ComponentType<LayoutProps>>,
  name: string | undefined,
): React.ComponentType<LayoutProps> {
  const layoutName = name || 'default'
  return layouts[layoutName] || layouts.default
}

/**
 * Get layout name from frontmatter
 */
export function getLayoutName(frontmatter: Record<string, any> | undefined, slideNo: number): string {
  if (frontmatter?.layout) {
    return frontmatter.layout
  }
  // First slide defaults to 'cover'
  return slideNo === 1 ? 'cover' : 'default'
}
