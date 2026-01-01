/**
 * 各種時計フォーマット変換
 */

/** Hex時計: HH:MM:SS を16進数で表示（2桁0埋め） */
export function formatHex(h: number, m: number, s: number): string {
  const pad2 = (n: number) => n.toString(16).toUpperCase().padStart(2, '0')
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/** Bit時計: HH:MM:SS を2進数で表示（時:5桁, 分秒:6桁0埋め） */
export function formatBit(h: number, m: number, s: number): string {
  return `${h.toString(2).padStart(5, '0')}:${m.toString(2).padStart(6, '0')}:${s.toString(2).padStart(6, '0')}`
}

/**
 * CS時計用: 0〜60 を CS文字に変換
 * - 値を "0x" + 2桁 として文字コードに対応する文字を返す
 * - 制御文字(0x00〜0x1F)は小文字化
 * - 例外: 00→O, 20→␠
 */
export function toCSChar(n: number): string {
  if (n === 0) return 'O'
  if (n === 20) return ' '

  // 10進数を "0x" + 2桁 として解釈
  const hexCode = parseInt(`0x${n.toString().padStart(2, '0')}`, 16)

  // 制御文字(0x00〜0x1F)は小文字化
  if (hexCode <= 0x1f) {
    // 0x00〜0x1F → 0x60〜0x7F (小文字相当)
    // ^@ (0x00) → ` (0x60) だが、a-z を使うため +0x61
    return String.fromCharCode(hexCode + 0x60)
  }

  return String.fromCharCode(hexCode)
}

/** CS時計: HH:MM:SS をCS文字で表示（コロンなし） */
export function formatCS(h: number, m: number, s: number): string {
  return `${toCSChar(h)}${toCSChar(m)}${toCSChar(s)}`
}
