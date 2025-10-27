/**
 * 1bitペアごとの確率分布を定義
 * 現行仕様：
 *   - 0,0 または 1,1 の場合：12.5% で反転
 *   - 0,1 と 1,0 は対称・等確率（50%）
 */
export function getBitMixDistribution() {
  return {
    '00': { p1: 0.125, p0: 0.875 }, // 同一で稀に反転
    '11': { p1: 0.875, p0: 0.125 },
    '01': { p1: 0.5, p0: 0.5 }, // 対称ペア
    '10': { p1: 0.5, p0: 0.5 },
  } as const
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
  dist: ReturnType<typeof getBitMixDistribution>
): number {
  const seed = (a * 37 + b * 73 + i * 97 + seedExtra * 11) & 0xff
  const pseudo = (seed ^ ((seed >> 3) * 11)) & 0xff
  const r = pseudo / 255

  const key =
    `${Math.min(bitA, bitB)}${Math.max(bitA, bitB)}` as keyof typeof dist
  const { p1 } = dist[key]

  return r < p1 ? 1 : 0
}

/**
 * mix8_seed 関数
 * 8bit整数を2つ（a, b）入力し、各bitごとにランダム的な合成を行う
 * @param a - 8bit整数入力1 (0〜255)
 * @param b - 8bit整数入力2 (0〜255)
 * @param seedExtra - 追加シード（デフォルト0）
 * @returns 合成結果 (0〜255)
 */
export function mix8(a: number, b: number, seedExtra = 0): number {
  const dist = getBitMixDistribution()
  let result = 0
  for (let i = 0; i < 8; i++) {
    const bitA = (a >> i) & 1
    const bitB = (b >> i) & 1
    const chosen = mixBit(bitA, bitB, a, b, i, seedExtra, dist)
    result |= chosen << i
  }
  return result & 0xff
}

export function getBitMixDistributionGolden() {
  const phi = (1 + Math.sqrt(5)) / 2
  const totalRatio = [1, phi]
  // 例: 総和 1:1.618 に収束するよう p1/p0 を動的スケーリング
  // 実際のロジックはここに later 実装
  return {
    '00': {
      p1: totalRatio[0] / (totalRatio[0] + totalRatio[1]),
      p0: totalRatio[1] / (totalRatio[0] + totalRatio[1]),
    },
    '11': {
      p1: totalRatio[1] / (totalRatio[0] + totalRatio[1]),
      p0: totalRatio[0] / (totalRatio[0] + totalRatio[1]),
    },
    '01': { p1: 0.5, p0: 0.5 },
    '10': { p1: 0.5, p0: 0.5 },
  }
}
