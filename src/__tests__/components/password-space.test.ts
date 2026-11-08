import {
  boxCox,
  formatCount,
  formatMultiplier,
  pickDecadeTicks,
  seriesByKey,
  symAnyFactor,
  symAnyWinsFrom,
} from '../../components/PasswordSpace/space'

const ALNUM = { base: 62, symbols: 32, length: 8 }

// 小さい設定で全列挙した数と式が一致するかを確かめる
const enumerateSymAny = (base: number, symbols: number, length: number) => {
  const seen = new Set<string>()
  const baseChars = Array.from({ length: base }, (_, i) => `b${i}`)
  const symChars = Array.from({ length: symbols }, (_, i) => `s${i}`)
  const strings = (n: number): string[][] =>
    n === 0
      ? [[]]
      : strings(n - 1).flatMap((rest) => baseChars.map((c) => [c, ...rest]))
  for (const str of strings(length)) {
    for (let pos = 0; pos <= length; pos++) {
      for (const sym of symChars) {
        seen.add([...str.slice(0, pos), sym, ...str.slice(pos)].join(','))
      }
    }
  }
  return seen.size
}

describe('series', () => {
  test('+1 文字は b 倍', () => {
    const diff = seriesByKey('plus1').ln(ALNUM) - seriesByKey('base').ln(ALNUM)
    expect(Math.exp(diff)).toBeCloseTo(62)
  })

  test('記号をどこか 1 か所に は (L+1)·s 倍', () => {
    const diff = seriesByKey('symAny').ln(ALNUM) - seriesByKey('base').ln(ALNUM)
    expect(Math.exp(diff)).toBeCloseTo(288)
    expect(symAnyFactor(ALNUM)).toBe(288)
  })

  test('記号をどこか 1 か所に の式は全列挙と一致し二重に数えない', () => {
    const p = { base: 3, symbols: 2, length: 3 }
    const expected = Math.round(Math.exp(seriesByKey('symAny').ln(p)))
    expect(enumerateSymAny(p.base, p.symbols, p.length)).toBe(expected)
  })
})

describe('symAnyWinsFrom', () => {
  test('ASCII 記号 32 種・英数なら L=1 から勝つ', () => {
    expect(symAnyWinsFrom(62, 32, 16)).toBe(1)
  })
  test('よく使う記号 10 種・英数なら L=6 から勝つ', () => {
    expect(symAnyWinsFrom(62, 10, 16)).toBe(6)
  })
  test('範囲内で逆転しなければ null', () => {
    expect(symAnyWinsFrom(62, 1, 16)).toBeNull()
  })
})

describe('boxCox', () => {
  test('λ=0 は ln、λ=1 は N-1', () => {
    expect(boxCox(Math.log(100), 0)).toBeCloseTo(Math.log(100))
    expect(boxCox(Math.log(100), 1)).toBeCloseTo(99)
  })
  test('λ→0 で ln に連続する', () => {
    expect(boxCox(Math.log(1e6), 1e-6)).toBeCloseTo(Math.log(1e6), 3)
  })
})

describe('format', () => {
  test('6 桁未満は実数、それ以上は指数表記', () => {
    expect(formatCount(Math.log(12345))).toBe('12,345')
    expect(formatCount(Math.log(2.5e14))).toBe('2.50×10¹⁴')
  })
  test('倍率', () => {
    expect(formatMultiplier(Math.log(288))).toBe('×288')
    expect(formatMultiplier(Math.log(1e12))).toBe('×10¹²')
  })
})

describe('pickDecadeTicks', () => {
  test('間隔が詰まった目盛りを間引く', () => {
    const ticks = pickDecadeTicks(Math.log(1e4), (ln) => 100 - ln * 2, 10)
    const gaps = ticks.slice(1).map((t, i) => t.py - ticks[i].py)
    expect(ticks[0].decade).toBe(4)
    expect(gaps.every((g) => g >= 10)).toBe(true)
  })
})
