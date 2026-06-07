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

/** REQ-TP01/TP02: 予定 → テキスト。 */
export function encodePlanText(plan: PlanState): string {
  const lines = [`@${formatClock(plan.startClockMin)}`]

  for (const s of plan.steps) {
    const dur = formatDuration(s.durationMin)

    lines.push(s.name ? `${s.name} ${dur}` : dur)
  }

  return lines.join('\n')
}

/** REQ-TP03..TP09: テキスト → 予定。例外を投げず、常に PlanState を返す。 */
export function decodePlanText(text: string, fallbackStart = 0): PlanState {
  let startClockMin = Math.max(0, fallbackStart)
  const steps: PlanState['steps'] = []

  for (const raw of text.split('\n')) {
    const line = raw.trim()

    if (!line) continue

    if (line.startsWith('@')) {
      const c = parseClock(line.slice(1).trim())

      if (c !== null) startClockMin = c
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

  return { startClockMin, steps }
}
