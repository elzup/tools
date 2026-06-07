import type { PlanState } from '../../../lib/progress-timer/types'
import {
  computePlanRows,
  setDuration,
  setAbsoluteEnd,
  setCumulativeEnd,
  setAbsoluteStart,
  totalDurationMin,
  planEndClockMin,
} from '../../../lib/progress-timer/schedule'

// 例: 14:00 開始, 40 / 1:30(90) / 0:20(20) / 0:70(70)
const plan: PlanState = {
  startClockMin: 840, // 14:00
  steps: [
    { id: 'a', name: 'stepA', durationMin: 40 },
    { id: 'b', name: 'stepB', durationMin: 90 },
    { id: 'c', name: 'stepC', durationMin: 20 },
    { id: 'd', name: 'stepD', durationMin: 70 },
  ],
}

describe('computePlanRows', () => {
  const rows = computePlanRows(plan)
  test('REQ-S01: 累積開始', () => {
    expect(rows.map((r) => r.cumStartMin)).toEqual([0, 40, 130, 150])
  })
  test('REQ-S02/S03: 絶対 開始/終了', () => {
    expect(rows.map((r) => r.absStartMin)).toEqual([840, 880, 970, 990])
    expect(rows.map((r) => r.absEndMin)).toEqual([880, 970, 990, 1060])
  })
  test('累積終了', () => {
    expect(rows.map((r) => r.cumEndMin)).toEqual([40, 130, 150, 220])
  })
  test('REQ-S04: 空ステップ', () => {
    expect(computePlanRows({ startClockMin: 840, steps: [] })).toEqual([])
  })
})

describe('逆算編集', () => {
  test('REQ-S05: setDuration', () => {
    const next = setDuration(plan, 0, 50)
    expect(next.steps[0].durationMin).toBe(50)
    expect(computePlanRows(next).map((r) => r.absStartMin)).toEqual([
      840, 890, 980, 1000,
    ])
    // 元は不変 (immutable)
    expect(plan.steps[0].durationMin).toBe(40)
  })
  test('REQ-S06: setAbsoluteEnd で所要を逆算', () => {
    // stepA 終了を 14:50(890) に → 所要 50
    const next = setAbsoluteEnd(plan, 0, 890)
    expect(next.steps[0].durationMin).toBe(50)
  })
  test('REQ-S07: setCumulativeEnd', () => {
    // stepB の累積終了を 2:00(120) に → cumStart 40 なので所要 80
    const next = setCumulativeEnd(plan, 1, 120)
    expect(next.steps[1].durationMin).toBe(80)
  })
  test('REQ-S08: 先頭の絶対開始は起点移動', () => {
    const next = setAbsoluteStart(plan, 0, 900) // 15:00
    expect(next.startClockMin).toBe(900)
    expect(next.steps[0].durationMin).toBe(40)
  })
  test('REQ-S08: 非先頭の絶対開始は前ステップ所要を変える', () => {
    // stepB 開始を 14:30(870) → stepA 所要 30
    const next = setAbsoluteStart(plan, 1, 870)
    expect(next.steps[0].durationMin).toBe(30)
  })
  test('REQ-S09: setAbsoluteEnd の負所要は 0 クランプ', () => {
    const next = setAbsoluteEnd(plan, 0, 800) // 開始(840)より前
    expect(next.steps[0].durationMin).toBe(0)
  })
  test('REQ-S09: setCumulativeEnd の負所要は 0 クランプ', () => {
    const next = setCumulativeEnd(plan, 1, 10) // cumStart 40 > 10
    expect(next.steps[1].durationMin).toBe(0)
  })
  test('REQ-S09: setAbsoluteStart(非先頭) の負所要は 0 クランプ', () => {
    const next = setAbsoluteStart(plan, 1, 800) // stepA開始840より前 → 前所要負
    expect(next.steps[0].durationMin).toBe(0)
  })
})

describe('REQ-S12: 範囲外 index は no-op (throw しない)', () => {
  test('setDuration / setAbsoluteEnd / setCumulativeEnd / setAbsoluteStart', () => {
    expect(setDuration(plan, 99, 10)).toEqual(plan)
    expect(setAbsoluteEnd(plan, 99, 10)).toEqual(plan)
    expect(setCumulativeEnd(plan, -1, 10)).toEqual(plan)
    expect(setAbsoluteStart(plan, 99, 10)).toEqual(plan)
  })
  test('setAbsoluteStart(0) は空 steps でも起点を移動', () => {
    const empty: PlanState = { startClockMin: 840, steps: [] }
    expect(setAbsoluteStart(empty, 0, 900).startClockMin).toBe(900)
  })
  test('REQ-S08a: 起点の負入力は 0 クランプ (model 不変条件)', () => {
    expect(setAbsoluteStart(plan, 0, -100).startClockMin).toBe(0)
  })
})

describe('合計', () => {
  test('REQ-S10/S11', () => {
    expect(totalDurationMin(plan)).toBe(220)
    expect(planEndClockMin(plan)).toBe(1060) // 17:40
  })
})
