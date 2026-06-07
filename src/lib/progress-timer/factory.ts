/**
 * ID 生成と既定進行表 (design:model / spec:share REQ-SH08)
 */
import type { PlanState, Step } from './types'

let seq = 0

/** 一意な安定 ID を生成する。 */
export function genId(): string {
  seq += 1

  return `s${Date.now().toString(36)}-${seq}`
}

export function createStep(name: string, durationMin: number): Step {
  return { id: genId(), name, durationMin }
}

/** 既定の進行表 (サンプル: 14:00 開始)。 */
export function defaultPlan(): PlanState {
  return {
    startClockMin: 14 * 60,
    steps: [
      createStep('stepA', 40),
      createStep('stepB', 90),
      createStep('stepC', 20),
      createStep('stepD', 70),
    ],
  }
}

export function emptyActual() {
  return { startedAtMin: null, boundaryDeltas: {} as Record<number, number> }
}
