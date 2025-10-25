/**
 * mix8_seed 関数
 * 8bit整数を2つ（a, b）入力し、各bitごとにランダム的な合成を行う
 * @param a - 8bit整数入力1 (0〜255)
 * @param b - 8bit整数入力2 (0〜255)
 * @param seedExtra - 追加シード（デフォルト0）
 * @returns 合成結果 (0〜255)
 */
export function mix8(a: number, b: number, seedExtra = 0): number {
  let result = 0
  for (let i = 0; i < 8; i++) {
    const bitA = (a >> i) & 1
    const bitB = (b >> i) & 1
    let chosen = bitA
    if (bitA !== bitB) {
      const seed = (a * 37 + b * 73 + i * 97 + seedExtra * 11) & 0xff
      const pseudo = (seed ^ ((seed >> 3) * 11)) & 0xff
      chosen = pseudo & 1 ? bitA : bitB
    }
    result |= chosen << i
  }
  return result & 0xff
}
