/**
 * bitペア (小さい方→大きい方で正規化したキー) ごとの「結果が1になる確率」分布。
 * p1 + p0 = 1 を常に満たす。
 */
export type BitPairKey = '00' | '01' | '10' | '11'
export type BitMixDistribution = Record<BitPairKey, { p1: number; p0: number }>

/**
 * 各ペアの p1 (1 になる確率) から分布を組み立てる。p0 は 1 - p1。
 */
export function makeDistribution(p1: Record<BitPairKey, number>): BitMixDistribution {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

  return {
    '00': { p1: clamp01(p1['00']), p0: 1 - clamp01(p1['00']) },
    '01': { p1: clamp01(p1['01']), p0: 1 - clamp01(p1['01']) },
    '10': { p1: clamp01(p1['10']), p0: 1 - clamp01(p1['10']) },
    '11': { p1: clamp01(p1['11']), p0: 1 - clamp01(p1['11']) },
  }
}

/**
 * 1bitペアごとの確率分布を定義 (デフォルト)
 * 現行仕様：
 *   - 0,0 または 1,1 の場合：12.5% で反転
 *   - 0,1 と 1,0 は対称・等確率（50%）
 */
export function getBitMixDistribution(): BitMixDistribution {
  return {
    '00': { p1: 0.125, p0: 0.875 }, // 同一で稀に反転
    '11': { p1: 0.875, p0: 0.125 },
    '01': { p1: 0.5, p0: 0.5 }, // 対称ペア
    '10': { p1: 0.5, p0: 0.5 },
  }
}

/**
 * bitA, bitB, seed から1bitを混合
 * 擬似乱数 r ∈ [0,1] を生成し、p1に基づいて1/0を決定
 */
export function mixBit(
  bitA: number,
  bitB: number,
  a: number,
  b: number,
  i: number,
  seedExtra: number,
  dist: BitMixDistribution
): number {
  const seed = (a * 37 + b * 73 + i * 97 + seedExtra * 11) & 0xff
  const pseudo = (seed ^ ((seed >> 3) * 11)) & 0xff
  const r = pseudo / 255

  // ペアキーは正規化しない (01 と 10 を区別できるようにする)。
  const key = `${bitA}${bitB}` as BitPairKey
  const { p1 } = dist[key]

  return r < p1 ? 1 : 0
}

/**
 * mix8_seed 関数
 * 8bit整数を2つ（a, b）入力し、各bitごとにランダム的な合成を行う
 * @param a - 8bit整数入力1 (0〜255)
 * @param b - 8bit整数入力2 (0〜255)
 * @param seedExtra - 追加シード（デフォルト0）
 * @param dist - 混合分布（省略時はデフォルト分布）
 * @returns 合成結果 (0〜255)
 */
export function mix8(
  a: number,
  b: number,
  seedExtra = 0,
  dist: BitMixDistribution = getBitMixDistribution()
): number {
  let result = 0

  for (let i = 0; i < 8; i++) {
    const bitA = (a >> i) & 1
    const bitB = (b >> i) & 1
    const chosen = mixBit(bitA, bitB, a, b, i, seedExtra, dist)

    result |= chosen << i
  }

  return result & 0xff
}

/**
 * 黄金比分布: 同一ペアの保持/反転比を 1:φ に寄せる。相違ペアは等確率。
 */
export function getBitMixDistributionGolden(): BitMixDistribution {
  const phi = (1 + Math.sqrt(5)) / 2
  const small = 1 / (1 + phi)
  const large = phi / (1 + phi)

  return makeDistribution({
    '00': small, // 0,0 は稀に 1 へ
    '11': large, // 1,1 は高確率で 1 を保持
    '01': 0.5,
    '10': 0.5,
  })
}
