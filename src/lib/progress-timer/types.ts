/**
 * 進行タイマー データモデル (design:model)
 * 日付を持たず、当日の時計時刻 (0:00 からの分) で扱う。
 */

export type Step = {
  id: string
  name: string
  /** 配分 (分, >= 0) */
  durationMin: number
}

export type PlanState = {
  /**
   * 保存スロット識別子。テキストの `@9:00 projA_001` の第2トークン由来。
   * 未指定 (id なし) はどのスロットにも紐付かない作業中の予定。
   */
  id?: string
  /** 予定開始時刻 (当日 0:00 からの分, >= 0) */
  startClockMin: number
  steps: Step[]
}

export type ActualState = {
  /** 開始ボタンを押した時計時刻 (分)。null = 未開始 */
  startedAtMin: number | null
  /**
   * boundaryDeltas[i] = ステップ i の開始境界 (および i 以降すべて) を
   * 前後にずらす符号付き分。i は 0..steps.length。
   */
  boundaryDeltas: Record<number, number>
}

export type PlanRow = {
  index: number
  name: string
  durationMin: number
  cumStartMin: number
  cumEndMin: number
  absStartMin: number
  absEndMin: number
}

export type ActualRow = {
  index: number
  actualStartMin: number
  actualEndMin: number
}

export type StepProgress = {
  index: number
  elapsedMin: number
  remainMin: number
  /** 0..1 */
  ratio: number
}
