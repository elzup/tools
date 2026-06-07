import {
  defaultPlan,
  genId,
  emptyActual,
} from '../../../lib/progress-timer/factory'

describe('factory', () => {
  test('REQ-SH08: defaultPlan は妥当なサンプル進行表', () => {
    const p = defaultPlan()
    expect(p.startClockMin).toBe(840) // 14:00
    expect(p.steps).toHaveLength(4)
    expect(p.steps.map((s) => s.durationMin)).toEqual([40, 90, 20, 70])
    // 全 id が一意
    const ids = p.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(4)
  })
  test('genId は呼ぶたび一意', () => {
    expect(genId()).not.toBe(genId())
  })
  test('emptyActual は未開始', () => {
    expect(emptyActual()).toEqual({ startedAtMin: null, boundaryDeltas: {} })
  })
})
