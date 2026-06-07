---
id: spec:share
title: 進行表の永続化とURL共有
coherence:
  depends_on:
    - design:model
    - spec:notation
---

# spec:share — 永続化と URL 共有

## シリアライズ `serializePlan(plan): string`

予定 (startClockMin + steps) を URL 安全な短い文字列に変換する。

- REQ-SH01: THE SYSTEM SHALL `startClockMin` と各ステップ (`durationMin`, `name`) を 1 文字列に直列化する。
- REQ-SH02: THE SYSTEM SHALL ステップ名に含まれる区切り文字・マルチバイトを URL 安全にエンコードする。

## デシリアライズ `deserializePlan(text): PlanState | null`

- REQ-SH03: THE SYSTEM SHALL `serializePlan` 出力を元の `PlanState` に戻す (ラウンドトリップ: `deserializePlan(serializePlan(p))` が `p` と等価)。
- REQ-SH04: IF `text` が不正・破損 THEN THE SYSTEM SHALL `null` を返す (例外を投げない)。
- REQ-SH05: WHERE 復元したステップに `id` が無い THE SYSTEM SHALL 一意な `id` を再付与する。
- REQ-SH09: IF 復元値の `startClockMin` または `durationMin` が非整数・負・NaN (外部入力による model 不変条件違反) THEN THE SYSTEM SHALL `null` を返す (silent に不正 PlanState を生成しない)。

## localStorage

- REQ-SH06: WHEN 予定が編集された THE SYSTEM SHALL localStorage に自動保存する。
- REQ-SH07: WHEN ページ読込時に URL クエリ `?d=<encoded>` がある THE SYSTEM SHALL それを localStorage より優先して復元する。
- REQ-SH08: IF localStorage / URL いずれも無い THEN THE SYSTEM SHALL 既定の進行表 (サンプル) を表示する。
