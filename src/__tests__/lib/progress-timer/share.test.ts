import type { PlanState } from '../../../lib/progress-timer/types'
import {
  serializePlan,
  deserializePlan,
} from '../../../lib/progress-timer/share'

const plan: PlanState = {
  startClockMin: 840,
  steps: [
    { id: 'a', name: 'stepA', durationMin: 40 },
    { id: 'b', name: 'ミーティング, 本編', durationMin: 90 },
    { id: 'c', name: '', durationMin: 20 },
  ],
}

describe('serialize / deserialize', () => {
  test('REQ-SH03: round-trip', () => {
    const restored = deserializePlan(serializePlan(plan))
    expect(restored).not.toBeNull()
    expect(restored!.startClockMin).toBe(840)
    expect(restored!.steps.map((s) => s.durationMin)).toEqual([40, 90, 20])
    expect(restored!.steps.map((s) => s.name)).toEqual([
      'stepA',
      'ミーティング, 本編',
      '',
    ])
  })
  test('REQ-SH05: id 再付与 (一意)', () => {
    const restored = deserializePlan(serializePlan(plan))!
    const ids = restored.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toBeTruthy())
  })
  test('REQ-SH04: 破損入力は null (throw しない)', () => {
    expect(deserializePlan('')).toBeNull()
    expect(deserializePlan('!!!not-valid!!!')).toBeNull()
    expect(deserializePlan('%%%')).toBeNull()
  })
  test('REQ-SH01: 空ステップのラウンドトリップ', () => {
    const empty: PlanState = { startClockMin: 840, steps: [] }
    const restored = deserializePlan(serializePlan(empty))
    expect(restored).toEqual({ startClockMin: 840, steps: [] })
  })
  test('REQ-SH09: 負・小数の値は null (model 不変条件防御)', () => {
    const b64 = (s: string) => Buffer.from(s, 'binary').toString('base64')
    expect(deserializePlan(b64('-5;40,a'))).toBeNull() // 負 startClock
    expect(deserializePlan(b64('840;-5,a'))).toBeNull() // 負 duration
    expect(deserializePlan(b64('840;1.5,a'))).toBeNull() // 小数 duration
    expect(deserializePlan(b64('1.5;40,a'))).toBeNull() // 小数 startClock
  })
})
