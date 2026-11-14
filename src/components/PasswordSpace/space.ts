// パスワードの組み合わせ数を ln で扱う純粋関数群。
// 94^17 ≈ 10^33 のような値を Number に直接持つと線形表示で桁落ちするので、
// 計算・比較はすべて対数のまま行い、表示の直前にだけ戻す

export type Params = {
  /** 基本の文字種の数 (英数なら 62) */
  base: number
  /** 記号の候補数 */
  symbols: number
  /** 基準の長さ */
  length: number
}

export type SeriesKey =
  | 'base'
  | 'symEnd'
  | 'plus1'
  | 'symAny'
  | 'brute'
  | 'plus2'

export type Series = {
  key: SeriesKey
  name: string
  formula: string
  ln: (p: Params) => number
}

export const SERIES: Series[] = [
  {
    key: 'base',
    name: '基準',
    formula: 'b^L',
    ln: ({ base, length }) => length * Math.log(base),
  },
  {
    key: 'symEnd',
    name: '記号を末尾に 1 つ',
    formula: 's·b^L',
    ln: ({ base, symbols, length }) =>
      Math.log(symbols) + length * Math.log(base),
  },
  {
    key: 'plus1',
    name: '+1 文字',
    formula: 'b^(L+1)',
    ln: ({ base, length }) => (length + 1) * Math.log(base),
  },
  {
    key: 'symAny',
    name: '記号をどこか 1 か所に',
    formula: '(L+1)·s·b^L',
    ln: ({ base, symbols, length }) =>
      Math.log(length + 1) + Math.log(symbols) + length * Math.log(base),
  },
  {
    key: 'brute',
    name: '記号込みで総当たり',
    formula: '(b+s)^(L+1)',
    ln: ({ base, symbols, length }) => (length + 1) * Math.log(base + symbols),
  },
  {
    key: 'plus2',
    name: '+2 文字 (参考)',
    formula: 'b^(L+2)',
    ln: ({ base, length }) => (length + 2) * Math.log(base),
  },
]

export const seriesByKey = (key: SeriesKey): Series => {
  const found = SERIES.find((s) => s.key === key)
  if (found === undefined) throw new Error(`unknown series: ${key}`)
  return found
}

/**
 * Box-Cox 変換。λ=1 で線形 (N-1)、λ→0 の極限が ln N なので
 * 途中の λ は「線形と対数のあいだ」として連続につながる
 */
export const boxCox = (lnN: number, lambda: number): number =>
  lambda === 0 ? lnN : Math.expm1(lambda * lnN) / lambda

/** 記号を任意位置に 1 つ入れたとき、元の 1 文字列あたり何通りに増えるか */
export const symAnyFactor = ({ symbols, length }: Params) =>
  symbols * (length + 1)

/** 記号を任意位置に 1 つ入れる方が +1 文字より強くなる最小の L (無ければ null) */
export const symAnyWinsFrom = (
  base: number,
  symbols: number,
  maxLength: number
): number | null => {
  for (let length = 1; length <= maxLength; length++) {
    if (symbols * (length + 1) > base) return length
  }
  return null
}

const LN10 = Math.log(10)
const SUPERSCRIPTS = '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'
// 6 桁までは実数を並べた方が直感的。それ以上は桁が読めなくなるので指数表記
const PLAIN_MAX_DIGITS = 6

export const sup = (n: number) =>
  String(n).replace(/[-0-9]/g, (c) => SUPERSCRIPTS['-0123456789'.indexOf(c)])

export const formatCount = (lnN: number): string => {
  const log10 = lnN / LN10
  if (log10 < PLAIN_MAX_DIGITS) {
    return Math.round(Math.exp(lnN)).toLocaleString('en-US')
  }
  const exp = Math.floor(log10)
  const mantissa = 10 ** (log10 - exp)
  return `${mantissa.toFixed(2)}×10${sup(exp)}`
}

export const formatMultiplier = (lnRatio: number): string => {
  const log10 = lnRatio / LN10
  if (log10 < PLAIN_MAX_DIGITS + 1) {
    return `×${Math.round(Math.exp(lnRatio)).toLocaleString('en-US')}`
  }
  return `×10${sup(Math.round(log10))}`
}

export const toBits = (lnN: number) => lnN / Math.LN2

const TIME_UNITS: [string, number][] = [
  ['年', 31_557_600],
  ['日', 86_400],
  ['時間', 3_600],
  ['分', 60],
  ['秒', 1],
]
const UNIVERSE_AGE_YEARS = 1.38e10
// 1 万年を超えると「何年」の桁を指数で出した方が比較しやすい
const YEARS_EXP_THRESHOLD = 1e4

export const formatCrackTime = (lnN: number, guessesPerSec: number): string => {
  const sec = Math.exp(lnN - Math.log(guessesPerSec))
  if (sec < 1) return '1 秒未満'
  const years = sec / TIME_UNITS[0][1]
  if (years > UNIVERSE_AGE_YEARS) {
    return `宇宙の年齢 ×${formatCount(Math.log(years / UNIVERSE_AGE_YEARS))}`
  }
  if (years >= YEARS_EXP_THRESHOLD) return `${formatCount(Math.log(years))} 年`
  const [unit, unitSec] = TIME_UNITS.find(([, s]) => sec >= s) ?? TIME_UNITS[4]
  const v = sec / unitSec
  const shown = v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')
  return `${shown} ${unit}`
}

/** 棒の長さが 2 倍になるとき実数は何倍か (λ>0 で大きい N の近似) */
export const lambdaNote = (lambda: number): string => {
  if (lambda === 0) return '棒の長さ ∝ 桁数 (対数)'
  if (lambda === 1) return '棒の長さ ∝ パターン数 (線形)'
  return `棒の長さ 2 倍 ≒ パターン数 ${formatMultiplier(Math.LN2 / lambda)}`
}

export type ColorMap = Record<SeriesKey, { color: string; opacity: number }>

/**
 * 10^k の目盛りを上から順に拾い、直前に採用した目盛りから minGap 以上
 * 離れたものだけ残す。λ が大きいと下の桁が 1 点に潰れるため間引きが要る
 */
export const pickDecadeTicks = (
  maxLnN: number,
  toY: (lnN: number) => number,
  minGap: number
): { decade: number; py: number }[] => {
  const maxDecade = Math.floor(maxLnN / LN10)
  const decades = Array.from({ length: maxDecade + 1 }, (_, i) => maxDecade - i)
  return decades.reduce<{ decade: number; py: number }[]>((acc, decade) => {
    const py = toY(decade * LN10)
    const last = acc[acc.length - 1]
    return last === undefined || py - last.py >= minGap
      ? [...acc, { decade, py }]
      : acc
  }, [])
}
