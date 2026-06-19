import type { PlanState } from '../../../lib/progress-timer/types'
import {
  type SavedPlan,
  deserializeLibrary,
  removeFromLibrary,
  serializeLibrary,
  upsertLibrary,
} from '../../../lib/progress-timer/library'

const planA: PlanState = {
  id: 'projA_001',
  startClockMin: 540,
  steps: [{ id: 'a', name: 'stepA', durationMin: 40 }],
}
const planB: PlanState = {
  id: 'projB_002',
  startClockMin: 600,
  steps: [{ id: 'b', name: 'stepB', durationMin: 90 }],
}

describe('upsertLibrary', () => {
  test('新しい id は末尾に追加', () => {
    const lib = upsertLibrary([], planA)
    expect(lib.map((e) => e.id)).toEqual(['projA_001'])
  })
  test('同じ id は上書き (件数は増えない)', () => {
    const lib = upsertLibrary(upsertLibrary([], planA), {
      ...planA,
      startClockMin: 999,
    })
    expect(lib).toHaveLength(1)
    expect(lib[0].plan.startClockMin).toBe(999)
  })
  test('id 無しの予定は保存しない', () => {
    const anon: PlanState = { startClockMin: 0, steps: [] }
    expect(upsertLibrary([], anon)).toEqual([])
  })
})

describe('removeFromLibrary', () => {
  test('id でスロットを取り除く', () => {
    const lib = upsertLibrary(upsertLibrary([], planA), planB)
    expect(removeFromLibrary(lib, 'projA_001').map((e) => e.id)).toEqual([
      'projB_002',
    ])
  })
})

describe('serialize/deserialize round-trip', () => {
  test('複数スロットを保存・復元できる', () => {
    const lib = upsertLibrary(upsertLibrary([], planA), planB)
    const back = deserializeLibrary(serializeLibrary(lib))
    expect(back.map((e) => e.id)).toEqual(['projA_001', 'projB_002'])
    expect(back[0].plan.id).toBe('projA_001')
    expect(back[1].plan.startClockMin).toBe(600)
  })
  test('null / 不正 JSON は空配列', () => {
    expect(deserializeLibrary(null)).toEqual([])
    expect(deserializeLibrary('{not json')).toEqual([])
    expect(deserializeLibrary('{}')).toEqual([])
  })
  test('破損エントリは取り除く', () => {
    const broken: SavedPlan[] = []
    const text = JSON.stringify([
      { id: 'ok', data: serializeLibrary(upsertLibrary([], planA)) }, // data が壊れている
      { id: '', data: 'x' }, // id 空
      { data: 'x' }, // id 無し
    ])
    expect(deserializeLibrary(text)).toEqual(broken)
  })
})
