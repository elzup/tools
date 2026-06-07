/**
 * 実績進行・境界ずらし・現在ステップ判定 (spec:adjustment)
 */
import type { PlanState, ActualState, ActualRow, StepProgress } from './types'

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * 境界 0..n の実績時計時刻。未開始なら空配列。
 * boundaryClock[i] = startedAtMin + cumStart[i] + Σ_{k=0..i} boundaryDeltas[k]
 */
function computeBoundaryClocks(plan: PlanState, actual: ActualState): number[] {
  if (actual.startedAtMin === null) return []
  const n = plan.steps.length
  const clocks: number[] = []
  let cum = 0
  let deltaAcc = 0

  for (let i = 0; i <= n; i++) {
    deltaAcc += actual.boundaryDeltas[i] ?? 0
    clocks.push(actual.startedAtMin + cum + deltaAcc)
    if (i < n) cum += plan.steps[i].durationMin
  }

  return clocks
}

/** REQ-A01: 現在時刻を起点に固定し delta をリセットした新しい実績状態を返す。 */
export function startActual(nowMin: number): ActualState {
  return { startedAtMin: nowMin, boundaryDeltas: {} }
}

/** REQ-A03/A04/A05: 実績スケジュール。 */
export function computeActualRows(
  plan: PlanState,
  actual: ActualState
): ActualRow[] {
  const clocks = computeBoundaryClocks(plan, actual)

  if (clocks.length === 0) return []

  return plan.steps.map((_, i) => ({
    index: i,
    actualStartMin: clocks[i],
    actualEndMin: clocks[i + 1],
  }))
}

/** REQ-A06: 境界 b を deltaMin ずらす (累積)。 */
export function shiftBoundary(
  actual: ActualState,
  boundaryIndex: number,
  deltaMin: number
): ActualState {
  const prev = actual.boundaryDeltas[boundaryIndex] ?? 0

  return {
    ...actual,
    boundaryDeltas: {
      ...actual.boundaryDeltas,
      [boundaryIndex]: prev + deltaMin,
    },
  }
}

/** REQ-A09..A12: 現在ステップ index。範囲外/未開始は null。 */
export function currentStepIndex(
  plan: PlanState,
  actual: ActualState,
  nowMin: number
): number | null {
  const clocks = computeBoundaryClocks(plan, actual)

  if (clocks.length === 0) return null
  const n = plan.steps.length

  if (nowMin < clocks[0]) return null
  if (nowMin >= clocks[n]) return null

  for (let i = 0; i < n; i++) {
    if (nowMin >= clocks[i] && nowMin < clocks[i + 1]) return i
  }

  return null
}

/** REQ-A13/A14: 現在ステップの経過/残り/比率。 */
export function stepProgress(
  plan: PlanState,
  actual: ActualState,
  nowMin: number
): StepProgress | null {
  const index = currentStepIndex(plan, actual, nowMin)

  if (index === null) return null
  const clocks = computeBoundaryClocks(plan, actual)
  const dur = clocks[index + 1] - clocks[index]
  const elapsedMin = nowMin - clocks[index]
  const remainMin = dur - elapsedMin
  const ratio = dur <= 0 ? 1 : clamp01(elapsedMin / dur)

  return { index, elapsedMin, remainMin, ratio }
}
