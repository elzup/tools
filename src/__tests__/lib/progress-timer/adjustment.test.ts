import type { PlanState, ActualState } from '../../../lib/progress-timer/types'
import {
  startActual,
  computeActualRows,
  shiftBoundary,
  currentStepIndex,
  stepProgress,
} from '../../../lib/progress-timer/adjustment'

const plan: PlanState = {
  startClockMin: 840,
  steps: [
    { id: 'a', name: 'A', durationMin: 40 },
    { id: 'b', name: 'B', durationMin: 90 },
    { id: 'c', name: 'C', durationMin: 20 },
  ],
}

const started: ActualState = { startedAtMin: 600, boundaryDeltas: {} } // 10:00 起点

describe('startActual', () => {
  test('REQ-A01: 現在時刻を起点に, delta リセット', () => {
    const a = startActual(600)
    expect(a.startedAtMin).toBe(600)
    expect(a.boundaryDeltas).toEqual({})
  })
})

describe('computeActualRows', () => {
  test('REQ-A03: 起点からの実績開始', () => {
    const rows = computeActualRows(plan, started)
    expect(rows.map((r) => r.actualStartMin)).toEqual([600, 640, 730])
    expect(rows.map((r) => r.actualEndMin)).toEqual([640, 730, 750])
  })
  test('REQ-A05: 未開始は空', () => {
    expect(
      computeActualRows(plan, { startedAtMin: null, boundaryDeltas: {} })
    ).toEqual([])
  })
})

describe('shiftBoundary', () => {
  test('REQ-A06/A07: 境界1を左に5分 → 後続平行移動, 前ステップ短縮', () => {
    const a = shiftBoundary(started, 1, -5)
    const rows = computeActualRows(plan, a)
    // 境界1(stepB開始)以降が -5
    expect(rows.map((r) => r.actualStartMin)).toEqual([600, 635, 725])
    // stepA(前)が 5 分短縮: 40 -> 35
    expect(rows[0].actualEndMin - rows[0].actualStartMin).toBe(35)
    // stepB の所要は不変 90
    expect(rows[1].actualEndMin - rows[1].actualStartMin).toBe(90)
  })
  test('REQ-A06: 累積 (同じ境界を二度ずらす)', () => {
    const a = shiftBoundary(shiftBoundary(started, 1, -5), 1, -3)
    expect(computeActualRows(plan, a)[1].actualStartMin).toBe(640 - 8)
  })
  test('REQ-A08: 非単調 (step1 終了 < 開始) になっても値は保持し逆算を壊さない', () => {
    // 境界2を -200 → step1 の終了が開始を追い越す (実績所要が負)
    const a = shiftBoundary(started, 2, -200)
    const rows = computeActualRows(plan, a)
    expect(rows[1].actualStartMin).toBe(640)
    expect(rows[1].actualEndMin).toBe(530) // 非単調 (保持, クランプしない)
    expect(rows[1].actualEndMin - rows[1].actualStartMin).toBe(-110)
    // ずらしを戻せば完全復元 (破壊的でない)
    const back = shiftBoundary(a, 2, 200)
    expect(computeActualRows(plan, back)[1].actualEndMin).toBe(730)
  })
})

describe('currentStepIndex', () => {
  test('REQ-A09: 範囲内', () => {
    expect(currentStepIndex(plan, started, 600)).toBe(0)
    expect(currentStepIndex(plan, started, 639)).toBe(0)
    expect(currentStepIndex(plan, started, 640)).toBe(1)
    expect(currentStepIndex(plan, started, 730)).toBe(2)
  })
  test('REQ-A10: 開始前は null', () => {
    expect(currentStepIndex(plan, started, 599)).toBeNull()
  })
  test('REQ-A11: 終了後は null', () => {
    expect(currentStepIndex(plan, started, 750)).toBeNull()
    expect(currentStepIndex(plan, started, 999)).toBeNull()
  })
  test('REQ-A12: 未開始は null', () => {
    expect(
      currentStepIndex(plan, { startedAtMin: null, boundaryDeltas: {} }, 600)
    ).toBeNull()
  })
})

describe('stepProgress', () => {
  test('REQ-A13: 経過/残り/比率', () => {
    const p = stepProgress(plan, started, 620) // stepA 開始20分
    expect(p).not.toBeNull()
    expect(p!.index).toBe(0)
    expect(p!.elapsedMin).toBe(20)
    expect(p!.remainMin).toBe(20)
    expect(p!.ratio).toBeCloseTo(0.5)
  })
  test('REQ-A13: 比率は 0..1 クランプ', () => {
    const p = stepProgress(plan, started, 600)
    expect(p!.ratio).toBe(0)
  })
  test('REQ-A13: ステップ末尾直前の比率', () => {
    const p = stepProgress(plan, started, 639) // stepA(所要40)の39分
    expect(p!.index).toBe(0)
    expect(p!.elapsedMin).toBe(39)
    expect(p!.remainMin).toBe(1)
    expect(p!.ratio).toBeCloseTo(39 / 40)
  })
  test('REQ-A15: 所要0ステップは現在ステップにならない (半開区間が空)', () => {
    const zeroPlan: PlanState = {
      startClockMin: 840,
      steps: [
        { id: 'z', name: 'Z', durationMin: 0 },
        { id: 'y', name: 'Y', durationMin: 30 },
      ],
    }
    // 境界 [600,600) は空 → step0 はスキップ, now=600 は step1 開始
    expect(currentStepIndex(zeroPlan, started, 600)).toBe(1)
    const p = stepProgress(zeroPlan, started, 600)
    expect(p!.index).toBe(1)
    expect(p!.ratio).toBe(0)
  })
  test('REQ-A14: stepProgress は未開始/終了後で null', () => {
    expect(stepProgress(plan, started, 599)).toBeNull()
    expect(stepProgress(plan, started, 9999)).toBeNull()
  })
})
