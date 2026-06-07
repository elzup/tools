---
id: spec:schedule
title: 予定スケジュール計算と3表記の逆算編集
coherence:
  depends_on:
    - design:model
    - spec:notation
---

# spec:schedule — 予定スケジュール

## 派生計算 `computePlanRows(plan): PlanRow[]`

各ステップに対し `{ index, name, durationMin, cumStartMin, cumEndMin, absStartMin, absEndMin }` を返す。

- REQ-S01: THE SYSTEM SHALL `cumStartMin[0] = 0`、`cumStartMin[i] = cumStartMin[i-1] + durationMin[i-1]` を満たす。
- REQ-S02: THE SYSTEM SHALL `absStartMin[i] = plan.startClockMin + cumStartMin[i]` を満たす。
- REQ-S03: THE SYSTEM SHALL `*EndMin = *StartMin + durationMin` を満たす。
- REQ-S04: WHEN `steps` が空 THE SYSTEM SHALL 空配列を返す。

## 逆算編集

3 表記いずれの編集も正準状態 (startClockMin / durationMin) に落とす純関数。後続ステップの絶対時刻は自動でずれる。

- REQ-S05: WHEN 配分 `durationMin[i]` を編集 THE SYSTEM SHALL 当該ステップの所要のみ更新し、後続の絶対/累積は再計算で追従する (`setDuration(plan, i, min)`)。
- REQ-S06: WHEN ステップ i の**絶対終了時刻**を `t` に編集 (`setAbsoluteEnd(plan, i, t)`) THE SYSTEM SHALL `durationMin[i] = t - absStartMin[i]` として逆算する。
- REQ-S07: WHEN ステップ i の**累積終了**を `c` に編集 (`setCumulativeEnd(plan, i, c)`) THE SYSTEM SHALL `durationMin[i] = c - cumStartMin[i]` として逆算する。
- REQ-S08a: WHEN 先頭ステップ (i=0) の**絶対開始時刻**を `t` に編集 THE SYSTEM SHALL `plan.startClockMin = max(0, t)` を更新する (起点移動, 負は 0 クランプで model 不変条件 startClockMin>=0 を維持)。
- REQ-S08b: WHEN 非先頭ステップ (i>0) の**絶対開始時刻**を `t` に編集 THE SYSTEM SHALL 直前ステップ (i-1) の所要を `t - absStart[i-1]` として逆算する (境界移動)。
- REQ-S09: IF 逆算結果の `durationMin` が負になる (例: 終了を開始より前に編集) THEN THE SYSTEM SHALL `0` にクランプする (負の所要を作らない)。REQ-S05/S06/S07/S08b 全エントリポイントで共通。
- REQ-S12: IF 範囲外 index `i` が渡される (`i < 0` または `i >= steps.length`) THEN THE SYSTEM SHALL plan を変更せずそのまま返す (純関数として例外を投げない)。

## 合計

- REQ-S10: `totalDurationMin(plan)` THE SYSTEM SHALL 全 `durationMin` の総和を返す (= 最終 `cumEndMin`)。
- REQ-S11: `planEndClockMin(plan)` THE SYSTEM SHALL `startClockMin + totalDurationMin` を返す。
