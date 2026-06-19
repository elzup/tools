/**
 * 配分ベースのテキスト protocol (spec:textproto)
 * リスト/タイムライン編集 ⇄ テキスト編集 の相互変換。
 */
import type { PlanState } from './types'
import {
  formatClock,
  formatDuration,
  parseClock,
  parseDuration,
} from './notation'
import { createStep } from './factory'

/** REQ-TP01/TP02: 予定 → テキスト。id があれば `@9:00 projA_001` 形式で先頭行に付与。 */
export function encodePlanText(plan: PlanState): string {
  const head = `@${formatClock(plan.startClockMin)}`
  const lines = [plan.id ? `${head} ${plan.id}` : head]

  for (const s of plan.steps) {
    const dur = formatDuration(s.durationMin)

    lines.push(s.name ? `${s.name} ${dur}` : dur)
  }

  return lines.join('\n')
}

/**
 * REQ-TP03..TP09: テキスト → 予定。例外を投げず、常に PlanState を返す。
 * 先頭の `@9:00 projA_001` のように時刻の後ろに付くトークンを id として扱う。
 */
export function decodePlanText(
  text: string,
  fallbackStart = 0,
  fallbackId?: string
): PlanState {
  let startClockMin = Math.max(0, fallbackStart)
  let id = fallbackId
  const steps: PlanState['steps'] = []

  for (const raw of text.split('\n')) {
    const line = raw.trim()

    if (!line) continue

    if (line.startsWith('@')) {
      const tokens = line.slice(1).trim().split(/\s+/)
      const c = parseClock(tokens[0])

      if (c !== null) startClockMin = c
      id = tokens.length > 1 ? tokens.slice(1).join(' ') : undefined
      continue
    }

    const tokens = line.split(/\s+/)
    const dur = parseDuration(tokens[tokens.length - 1])

    if (dur !== null) {
      steps.push(createStep(tokens.slice(0, -1).join(' '), dur))
    } else {
      steps.push(createStep(line, 0))
    }
  }

  return id ? { id, startClockMin, steps } : { startClockMin, steps }
}
