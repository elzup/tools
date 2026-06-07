/**
 * Phase 5: 形式的ハードニング (property-based / fuzz)
 * 依存追加を避け、jest 内のランダムループで不変条件を検証する。
 */
import type {
  ActualState,
  PlanState,
  Step,
} from '../../../lib/progress-timer/types'
import {
  formatDuration,
  parseDuration,
} from '../../../lib/progress-timer/notation'
import {
  computePlanRows,
  setDuration,
  totalDurationMin,
} from '../../../lib/progress-timer/schedule'
import {
  computeActualRows,
  shiftBoundary,
} from '../../../lib/progress-timer/adjustment'
import {
  serializePlan,
  deserializePlan,
} from '../../../lib/progress-timer/share'

const N = 300
const randInt = (max: number) => Math.floor(Math.random() * (max + 1))
const NAME_CHARS = 'ab ;,%日本語/:→\\"'
const randName = (): string => {
  const len = randInt(8)
  let s = ''

  for (let i = 0; i < len; i++) {
    s += NAME_CHARS[randInt(NAME_CHARS.length - 1)] ?? ''
  }

  return s
}

const randPlan = (): PlanState => {
  const n = randInt(8)
  const steps: Step[] = Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    name: randName(),
    durationMin: randInt(300),
  }))

  return { startClockMin: randInt(1439), steps }
}

const randActual = (n: number): ActualState => {
  const boundaryDeltas: Record<number, number> = {}

  for (let i = 0; i <= n; i++) {
    if (Math.random() < 0.4) boundaryDeltas[i] = randInt(60) - 30
  }

  return { startedAtMin: randInt(1439), boundaryDeltas }
}

describe('property: notation round-trip', () => {
  test('parseDuration(formatDuration(min)) === min (REQ-N13)', () => {
    for (let k = 0; k < N; k++) {
      const min = randInt(100000)
      expect(parseDuration(formatDuration(min))).toBe(min)
    }
  })
})

describe('property: plan schedule invariants', () => {
  test('絶対/累積の連続性と起点整合 (REQ-S01/S02/S03)', () => {
    for (let k = 0; k < N; k++) {
      const plan = randPlan()
      const rows = computePlanRows(plan)

      rows.forEach((r, i) => {
        // 各行: end = start + duration
        expect(r.absEndMin).toBe(r.absStartMin + r.durationMin)
        expect(r.cumEndMin).toBe(r.cumStartMin + r.durationMin)
        // 絶対 = 起点 + 累積
        expect(r.absStartMin).toBe(plan.startClockMin + r.cumStartMin)
        // 連続性: 次行の開始 = 今行の終了
        if (i + 1 < rows.length) {
          expect(rows[i + 1].absStartMin).toBe(r.absEndMin)
          expect(rows[i + 1].cumStartMin).toBe(r.cumEndMin)
        }
      })
      // 累積終端 = 合計
      if (rows.length > 0) {
        expect(rows[rows.length - 1].cumEndMin).toBe(totalDurationMin(plan))
      }
    }
  })

  test('setDuration は非負を保証し合計に反映 (REQ-S05/S09)', () => {
    for (let k = 0; k < N; k++) {
      const plan = randPlan()

      if (plan.steps.length === 0) continue
      const i = randInt(plan.steps.length - 1)
      const next = setDuration(plan, i, randInt(120) - 40) // 負含む
      expect(next.steps[i].durationMin).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('property: actual schedule invariants', () => {
  test('実績行の連続性 actualEnd[i] === actualStart[i+1]', () => {
    for (let k = 0; k < N; k++) {
      const plan = randPlan()
      const actual = randActual(plan.steps.length)
      const rows = computeActualRows(plan, actual)

      rows.forEach((r, i) => {
        if (i + 1 < rows.length) {
          expect(rows[i + 1].actualStartMin).toBe(r.actualEndMin)
        }
      })
    }
  })

  test('shiftBoundary は可逆 (d → -d で元に戻る)', () => {
    for (let k = 0; k < N; k++) {
      const plan = randPlan()

      if (plan.steps.length === 0) continue
      const actual = randActual(plan.steps.length)
      const b = randInt(plan.steps.length)
      const d = randInt(60) - 30
      const there = shiftBoundary(actual, b, d)
      const back = shiftBoundary(there, b, -d)
      expect(computeActualRows(plan, back)).toEqual(
        computeActualRows(plan, actual)
      )
    }
  })
})

describe('property: share round-trip', () => {
  test('deserialize(serialize(p)) は start/duration/name を保存 (REQ-SH03)', () => {
    for (let k = 0; k < N; k++) {
      const plan = randPlan()
      const restored = deserializePlan(serializePlan(plan))
      expect(restored).not.toBeNull()
      expect(restored!.startClockMin).toBe(plan.startClockMin)
      expect(restored!.steps.map((s) => s.durationMin)).toEqual(
        plan.steps.map((s) => s.durationMin)
      )
      expect(restored!.steps.map((s) => s.name)).toEqual(
        plan.steps.map((s) => s.name)
      )
    }
  })
})
