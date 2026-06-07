import {
  parseDuration,
  formatDuration,
  parseClock,
  formatClock,
  formatCumulative,
  formatClockSec,
} from '../../../lib/progress-timer/notation'

describe('parseDuration', () => {
  test('REQ-N01: 裸数字は分', () => {
    expect(parseDuration('40')).toBe(40)
    expect(parseDuration('0')).toBe(0)
  })
  test('REQ-N02: H:MM は 時*60+分', () => {
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('0:20')).toBe(20)
  })
  test('REQ-N03: コロン右の超過表記を許容', () => {
    expect(parseDuration('0:70')).toBe(70)
    expect(parseDuration('0:70')).toBe(parseDuration('1:10'))
  })
  test('REQ-N04: 前後空白をトリム', () => {
    expect(parseDuration('  1:30 ')).toBe(90)
    expect(parseDuration(' 40 ')).toBe(40)
  })
  test('REQ-N05: 不正は null', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('1:2:3')).toBeNull()
    expect(parseDuration('-5')).toBeNull()
    expect(parseDuration('1.5')).toBeNull()
    expect(parseDuration(':30')).toBeNull()
    expect(parseDuration('1:')).toBeNull()
  })
})

describe('formatDuration', () => {
  test('REQ-N06: 60 未満は裸数字', () => {
    expect(formatDuration(40)).toBe('40')
    expect(formatDuration(0)).toBe('0')
    expect(formatDuration(59)).toBe('59')
  })
  test('REQ-N07: 60 以上は H:MM 0埋め', () => {
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(70)).toBe('1:10')
    expect(formatDuration(120)).toBe('2:00')
    expect(formatDuration(60)).toBe('1:00')
  })
})

describe('parseClock / formatClock', () => {
  test('REQ-N08: 時刻パース', () => {
    expect(parseClock('14:40')).toBe(880)
    expect(parseClock('14:00')).toBe(840)
    expect(parseClock('0:00')).toBe(0)
  })
  test('REQ-N09: 不正は null', () => {
    expect(parseClock('14')).toBeNull()
    expect(parseClock('x')).toBeNull()
  })
  test('REQ-N10: 時刻フォーマット', () => {
    expect(formatClock(880)).toBe('14:40')
    expect(formatClock(840)).toBe('14:00')
    expect(formatClock(0)).toBe('0:00')
  })
  test('REQ-N11: 24h 超過は時を保持', () => {
    expect(formatClock(1500)).toBe('25:00')
  })
})

describe('formatClockSec', () => {
  test('REQ-N14: 秒つき H:MM:SS', () => {
    expect(formatClockSec(840)).toBe('14:00:00')
    expect(formatClockSec(880.5)).toBe('14:40:30') // 0.5分 = 30秒
    expect(formatClockSec(0)).toBe('0:00:00')
    // 小数分の秒切り捨て: 46.6分 = 46分36秒
    expect(formatClockSec(46.6)).toBe('0:46:36')
  })
})

describe('formatCumulative', () => {
  test('REQ-N12: 常に H:MM', () => {
    expect(formatCumulative(40)).toBe('0:40')
    expect(formatCumulative(130)).toBe('2:10')
    expect(formatCumulative(0)).toBe('0:00')
  })
})

describe('REQ-N13: round-trip', () => {
  test('parseDuration(formatDuration(min)) === min', () => {
    for (const min of [0, 1, 40, 59, 60, 70, 90, 120, 599, 1000]) {
      expect(parseDuration(formatDuration(min))).toBe(min)
    }
  })
})
