/**
 * 配分表記・時刻表記の相互変換 (spec:notation)
 * 配分の単位は 時:分 (H:MM)。コロン省略時は分。コロン右は 59 超過を許容。
 */

const BARE = /^\d+$/
const COLON = /^(\d+):(\d+)$/

/** 配分表記 → 分。不正・安全整数外は null。 */
export function parseDuration(text: string): number | null {
  const t = text.trim()

  if (BARE.test(t)) {
    const n = Number(t)

    return Number.isSafeInteger(n) ? n : null
  }
  const m = COLON.exec(t)

  if (m) {
    const n = Number(m[1]) * 60 + Number(m[2])

    return Number.isSafeInteger(n) ? n : null
  }

  return null
}

/** 分 → 配分表記。60 未満は裸数字、以上は H:MM (分 2 桁)。 */
export function formatDuration(min: number): string {
  if (min < 60) return String(min)
  const h = Math.floor(min / 60)
  const m = min % 60

  return `${h}:${String(m).padStart(2, '0')}`
}

/** 時刻表記 (H:MM) → 当日分。不正は null。 */
export function parseClock(text: string): number | null {
  const m = COLON.exec(text.trim())

  if (!m) return null

  return Number(m[1]) * 60 + Number(m[2])
}

/** 当日分 → 時刻表記 (H:MM, 時は無パディング, 分 2 桁, 24h 超過は時を保持, 負は符号付き)。 */
export function formatClock(min: number): string {
  const sign = min < 0 ? '-' : ''
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60

  return `${sign}${h}:${String(m).padStart(2, '0')}`
}

/** 経過分 → 累積表記 (常に H:MM)。 */
export function formatCumulative(min: number): string {
  return formatClock(min)
}
