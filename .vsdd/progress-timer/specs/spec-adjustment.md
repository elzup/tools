---
id: spec:adjustment
title: 実績進行・境界ずらし・現在ステップ判定
coherence:
  depends_on:
    - design:model
    - spec:schedule
---

# spec:adjustment — 実績進行 (予定とは別レイヤ)

予定 (plan) はそのまま残し、実績 (actual) を別に計算する。開始ボタンで `startedAtMin` に現在時刻を固定し、以降の実時間で現在ステップを示す。境界の左右ずらし調整ができ、ずらした境界以降が剛体的に追従する。

## 実績開始

- REQ-A01: WHEN ユーザーが開始ボタンを押す (`startActual(nowMin)`) THE SYSTEM SHALL `startedAtMin = nowMin`、`boundaryDeltas = {}` の新しい実績状態を返す。
- REQ-A02: WHILE `startedAtMin === null` THE SYSTEM SHALL 実績を未開始として扱い現在ステップを返さない。

## 実績スケジュール `computeActualRows(plan, actual): ActualRow[]`

`boundaryDeltas[i]` = ステップ i の開始境界 (および i 以降すべて) をずらす符号付き分。

- REQ-A03: THE SYSTEM SHALL `actualStart[i] = startedAtMin + cumStartMin[i] + Σ_{k=0..i} boundaryDeltas[k]` を満たす (未設定 delta は 0)。
- REQ-A04: THE SYSTEM SHALL ステップ i の実績所要 `actualDur[i] = durationMin[i] + (boundaryDeltas[i+1] ?? 0)` を満たす (境界 i+1 を左にずらすと前ステップ i が短くなる)。
- REQ-A05: WHEN `startedAtMin === null` THE SYSTEM SHALL 空配列を返す。

## 境界ずらし `shiftBoundary(actual, boundaryIndex, deltaMin)`

- REQ-A06: WHEN 境界 `b` (1 <= b <= n) を `deltaMin` (例 -5) ずらす THE SYSTEM SHALL `boundaryDeltas[b] += deltaMin` を累積し、境界 b 以降の `actualStart` を `deltaMin` 分平行移動する。後続の予定開始時刻もずれて見える。
- REQ-A07: WHERE `deltaMin` が負 (左ずらし) THE SYSTEM SHALL 直前ステップ (b-1) の実績所要を `deltaMin` 分短縮する (REQ-A04 と整合)。
- REQ-A08: IF ある時点で `actualStart[i] > actualStart[i+1]` となる調整 THEN THE SYSTEM SHALL 値を保持しつつ当該ステップの実績所要を負として計算しない (表示側は 0 クランプ)。逆算は破壊しない。

## 現在ステップ判定 `currentStepIndex(plan, actual, nowMin): number | null`

判定は半開区間 `[actualStart[i], actualStart[i+1])` で行う。

- REQ-A09: WHEN `actualStart[i] <= nowMin < actualStart[i+1]` THE SYSTEM SHALL `i` を返す。
- REQ-A10: IF `nowMin < actualStart[0]` THEN THE SYSTEM SHALL `null` (開始前) を返す。
- REQ-A11: IF `nowMin >= actualStart[n]` (最終終了以降) THEN THE SYSTEM SHALL `null` (終了済) を返す。
- REQ-A12: IF `startedAtMin === null` THEN THE SYSTEM SHALL `null` を返す。
- REQ-A15: WHERE 実績所要 0 のステップ (`actualStart[i] === actualStart[i+1]`) THE SYSTEM SHALL 半開区間が空であるため現在ステップとして返さない (スキップ)。

## 経過/残り `stepProgress(plan, actual, nowMin)`

- REQ-A13: WHERE 現在ステップが存在 THE SYSTEM SHALL `{ index, elapsedMin, remainMin, ratio }` を返す。`ratio` は `0..1` にクランプ。
- REQ-A14: WHERE 現在ステップが存在する以上その実績所要は必ず正 (REQ-A15)。THE SYSTEM SHALL なお防御として `dur <= 0` のとき `ratio = 1` を返し、ゼロ除算を構造的に排除する (通常到達しないガード)。
