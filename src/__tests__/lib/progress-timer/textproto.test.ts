import type { PlanState } from '../../../lib/progress-timer/types'
import {
  encodePlanText,
  decodePlanText,
} from '../../../lib/progress-timer/textproto'

const plan: PlanState = {
  startClockMin: 840, // 14:00
  steps: [
    { id: 'a', name: 'stepA', durationMin: 40 },
    { id: 'b', name: '本編 開始', durationMin: 90 },
    { id: 'c', name: '', durationMin: 20 },
    { id: 'd', name: 'stepD', durationMin: 70 },
  ],
}

describe('encodePlanText', () => {
  test('REQ-TP01/TP02: @開始 と name+配分', () => {
    expect(encodePlanText(plan)).toBe(
      ['@14:00', 'stepA 40', '本編 開始 1:30', '20', 'stepD 1:10'].join('\n')
    )
  })
})

describe('decodePlanText', () => {
  test('REQ-TP03: @行で開始時刻', () => {
    expect(decodePlanText('@9:30\nx 10').startClockMin).toBe(570)
  })
  test('REQ-TP03: 最後の@が有効, 不正@は無視', () => {
    expect(decodePlanText('@9:30\n@bad\n@10:00\nx 10').startClockMin).toBe(600)
  })
  test('REQ-TP04: 末尾トークンが配分, 残りが名前', () => {
    const p = decodePlanText('本編 開始 1:30')
    expect(p.steps[0]).toMatchObject({ name: '本編 開始', durationMin: 90 })
  })
  test('REQ-TP04: 名前省略 (配分のみ)', () => {
    expect(decodePlanText('40').steps[0]).toMatchObject({
      name: '',
      durationMin: 40,
    })
  })
  test('REQ-TP05: 配分不正は行全体を名前, 0分', () => {
    expect(decodePlanText('まだ未定').steps[0]).toMatchObject({
      name: 'まだ未定',
      durationMin: 0,
    })
  })
  test('REQ-TP06: 空行スキップ', () => {
    expect(decodePlanText('\n\na 10\n  \nb 20\n').steps).toHaveLength(2)
  })
  test('REQ-TP07: @無しは fallbackStart', () => {
    expect(decodePlanText('a 10', 840).startClockMin).toBe(840)
    expect(decodePlanText('a 10').startClockMin).toBe(0)
  })
  test('REQ-TP08: id 一意付与', () => {
    const p = decodePlanText('a 10\nb 20\nc 30')
    const ids = p.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(3)
    ids.forEach((id) => expect(id).toBeTruthy())
  })
  test('REQ-TP09: どんな入力でも throw しない', () => {
    expect(() => decodePlanText('')).not.toThrow()
    expect(() => decodePlanText('@@@@\n:::\n   ')).not.toThrow()
  })
})

describe('REQ-TP10: round-trip', () => {
  test('start/duration/name 保存 (数字・空白を含む名前でも)', () => {
    const tricky: PlanState = {
      startClockMin: 600,
      steps: [
        { id: '1', name: '40', durationMin: 90 }, // 名前が数字
        { id: '2', name: 'step 1:30', durationMin: 20 }, // 名前にコロン数字
        { id: '3', name: 'a b c', durationMin: 0 },
      ],
    }
    const back = decodePlanText(encodePlanText(tricky))
    expect(back.startClockMin).toBe(600)
    expect(back.steps.map((s) => s.durationMin)).toEqual([90, 20, 0])
    expect(back.steps.map((s) => s.name)).toEqual(['40', 'step 1:30', 'a b c'])
  })
})
