/**
 * Overview logic for React
 * Port of Vue client logic/overview.ts
 *
 * Manages overview navigation state.
 */

import { slides } from '../env'

// Overview state
let _currentOverviewPage = 1
let _overviewRowCount = 1

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

export function subscribeOverview(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const currentOverviewPage = {
  get value() { return _currentOverviewPage },
  set value(v: number) { _currentOverviewPage = v; notify() },
}

export const overviewRowCount = {
  get value() { return _overviewRowCount },
  set value(v: number) { _overviewRowCount = v; notify() },
}

const min = 1
function getMax() {
  return slides.length
}

export function prevOverviewPage() {
  if (currentOverviewPage.value > min)
    currentOverviewPage.value -= 1
}

export function nextOverviewPage() {
  if (currentOverviewPage.value < getMax())
    currentOverviewPage.value += 1
}

export function upOverviewPage() {
  if (currentOverviewPage.value > min) {
    let current = currentOverviewPage.value - overviewRowCount.value
    if (current < min)
      current = min

    currentOverviewPage.value = current
  }
}

export function downOverviewPage() {
  const max = getMax()
  if (currentOverviewPage.value < max) {
    let current = currentOverviewPage.value + overviewRowCount.value
    if (current > max)
      current = max

    currentOverviewPage.value = current
  }
}
