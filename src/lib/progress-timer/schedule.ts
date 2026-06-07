/**
 * 予定スケジュール計算と 3 表記の逆算編集 (spec:schedule)
 */
import type { PlanState, PlanRow, Step } from './types'

/** 各ステップの累積開始 (分) を返す。長さは steps.length。 */
function cumStarts(steps: Step[]): number[] {
  const acc: number[] = []
  let sum = 0

  for (const s of steps) {
    acc.push(sum)
    sum += s.durationMin
  }

  return acc
}

export function computePlanRows(plan: PlanState): PlanRow[] {
  const cums = cumStarts(plan.steps)

  return plan.steps.map((s, i) => {
    const cumStartMin = cums[i]
    const cumEndMin = cumStartMin + s.durationMin
    const absStartMin = plan.startClockMin + cumStartMin

    return {
      index: i,
      name: s.name,
      durationMin: s.durationMin,
      cumStartMin,
      cumEndMin,
      absStartMin,
      absEndMin: absStartMin + s.durationMin,
    }
  })
}

const inRange = (plan: PlanState, i: number): boolean =>
  i >= 0 && i < plan.steps.length

/** durationMin を 0 以上にクランプしてステップ i を差し替えた新 plan。範囲外は no-op (REQ-S12)。 */
function withDuration(
  plan: PlanState,
  i: number,
  durationMin: number
): PlanState {
  if (!inRange(plan, i)) return plan
  const clamped = Math.max(0, durationMin)

  return {
    ...plan,
    steps: plan.steps.map((s, idx) =>
      idx === i ? { ...s, durationMin: clamped } : s
    ),
  }
}

/** REQ-S05: 配分を直接編集。 */
export function setDuration(
  plan: PlanState,
  i: number,
  min: number
): PlanState {
  return withDuration(plan, i, min)
}

/** REQ-S06/S09/S12: ステップ i の絶対終了時刻を t に → 所要を逆算。 */
export function setAbsoluteEnd(
  plan: PlanState,
  i: number,
  t: number
): PlanState {
  if (!inRange(plan, i)) return plan
  const absStart = computePlanRows(plan)[i].absStartMin

  return withDuration(plan, i, t - absStart)
}

/** REQ-S07/S09/S12: ステップ i の累積終了を c に → 所要を逆算。 */
export function setCumulativeEnd(
  plan: PlanState,
  i: number,
  c: number
): PlanState {
  if (!inRange(plan, i)) return plan
  const cumStart = computePlanRows(plan)[i].cumStartMin

  return withDuration(plan, i, c - cumStart)
}

/**
 * REQ-S08a/S08b/S12: ステップ i の絶対開始時刻を t に。
 * 先頭 (i=0) は起点 (startClockMin) を移動。非先頭は前ステップ所要を変える。
 */
export function setAbsoluteStart(
  plan: PlanState,
  i: number,
  t: number
): PlanState {
  if (i === 0) return { ...plan, startClockMin: Math.max(0, t) }
  if (!inRange(plan, i)) return plan

  const prevStart = computePlanRows(plan)[i - 1].absStartMin

  return withDuration(plan, i - 1, t - prevStart)
}

export function totalDurationMin(plan: PlanState): number {
  return plan.steps.reduce((sum, s) => sum + s.durationMin, 0)
}

export function planEndClockMin(plan: PlanState): number {
  return plan.startClockMin + totalDurationMin(plan)
}
