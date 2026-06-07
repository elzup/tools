/**
 * 永続化と URL 共有 (spec:share)
 */
import type { PlanState } from './types'
import { genId } from './factory'

function b64urlEncode(s: string): string {
  const b64 =
    typeof btoa === 'function'
      ? btoa(s)
      : Buffer.from(s, 'binary').toString('base64')

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')

  return typeof atob === 'function'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary')
}

/** REQ-SH01/SH02: 予定を URL 安全文字列へ。 */
export function serializePlan(plan: PlanState): string {
  const body = [
    String(plan.startClockMin),
    ...plan.steps.map((s) => `${s.durationMin},${encodeURIComponent(s.name)}`),
  ].join(';')

  return b64urlEncode(body)
}

/** 0 以上の安全整数か (model 不変条件)。 */
const isNonNegInt = (n: number): boolean => Number.isSafeInteger(n) && n >= 0

/** REQ-SH03/SH04/SH05/SH09: 文字列を予定へ復元。破損・不正値は null。 */
export function deserializePlan(text: string): PlanState | null {
  if (!text) return null
  try {
    const body = b64urlDecode(text)
    const parts = body.split(';')
    const startClockMin = Number(parts[0])

    if (!isNonNegInt(startClockMin)) return null

    const steps = parts.slice(1).map((p) => {
      const ci = p.indexOf(',')

      if (ci === -1) return null
      const durationMin = Number(p.slice(0, ci))

      if (!isNonNegInt(durationMin)) return null

      return {
        id: genId(),
        name: decodeURIComponent(p.slice(ci + 1)),
        durationMin,
      }
    })

    if (steps.some((s) => s === null)) return null

    return { startClockMin, steps: steps as PlanState['steps'] }
  } catch {
    return null
  }
}
