---
id: design:model
title: 進行タイマー データモデル
coherence:
  depends_on: []
---

# design:model — データモデル

進行タイマー (進捗管理タイマー) の正準状態。**日付を持たず、当日の時計時刻 (0:00 からの分) で扱う。**

## 基本単位

- すべての内部表現は **分 (整数, 0 以上)** を基準とする。
- `clockMin` = 当日 0:00 からの経過分 (例: 14:00 → 840)。0 以上。24h を超える値も保持可 (深夜跨ぎ)。
- `durationMin` = ステップの所要分。0 以上の整数。

## 型

```ts
type Step = {
  id: string        // 安定 ID (並べ替え・React key 用)
  name: string      // ステップ名 (空文字許容)
  durationMin: number // 配分 (分, >= 0)
}

type PlanState = {
  startClockMin: number // 予定開始時刻 (当日 0:00 からの分, >= 0)
  steps: Step[]
}

// 実績進行 (予定とは別レイヤ)
type ActualState = {
  startedAtMin: number | null   // 開始ボタンを押した時計時刻 (分)。null = 未開始
  // boundaryDeltas[i] = 「ステップ i の開始境界」を i 以降ごと前後にずらす分量 (符号付き)
  // i は 0..steps.length。i=0 は全体起点 (= startedAtMin の微調整)。
  boundaryDeltas: Record<number, number>
}
```

## 3 つの表記 (同一境界の別ビュー)

正準状態は `startClockMin` + 各 `durationMin` のみ。以下は派生:

| 表記 | 意味 | 計算 |
|------|------|------|
| 配分 (allocation) | 各ステップの所要 | `durationMin` |
| 絶対 (absolute) | 各ステップ開始/終了の時計時刻 | `startClockMin + cumulative` |
| 累積 (cumulative) | 起点からの経過 | `Σ durationMin` |

- `cumulativeStart[i] = Σ_{k<i} durationMin[k]`
- `absoluteStart[i]  = startClockMin + cumulativeStart[i]`
- `absoluteEnd[i]    = absoluteStart[i] + durationMin[i]`

3 表記はいずれも編集可能で、どれを編集しても正準状態 (startClockMin / durationMin) に逆算され、後続が同期する。
