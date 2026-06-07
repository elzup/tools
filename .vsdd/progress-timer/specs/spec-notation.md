---
id: spec:notation
title: 配分表記・時刻表記のパース/フォーマット
coherence:
  depends_on:
    - design:model
---

# spec:notation — 表記の相互変換

配分表記の単位は **時:分 (H:MM)**。コロン省略時は分。コロン右は 59 を超える超過表記を許容する。

## 配分パース `parseDuration(text): number | null`

- REQ-N01: WHEN `text` が `/^\d+$/` (例 `"40"`) THE SYSTEM SHALL その数値を**分**として返す (`40` → `40`)。
- REQ-N02: WHEN `text` が `/^\d+:\d+$/` (例 `"1:30"`) THE SYSTEM SHALL `時*60 + 分` を返す (`1:30` → `90`)。
- REQ-N03: WHERE コロン右が 60 以上 (超過表記, 例 `"0:70"`) THE SYSTEM SHALL 繰り上げず単純加算した分を返す (`0:70` → `70`, `1:10` と同値)。
- REQ-N04: WHEN `text` の前後に空白がある THE SYSTEM SHALL トリムしてから判定する。
- REQ-N05: IF `text` が空文字または上記いずれにも一致しない (例 `"abc"`, `"1:2:3"`, `"-5"`, `"1.5"`) THEN THE SYSTEM SHALL `null` を返す。

## 配分フォーマット `formatDuration(min): string`

- REQ-N06: WHEN `min < 60` THE SYSTEM SHALL 分のみの裸数字を返す (`40` → `"40"`, `0` → `"0"`)。
- REQ-N07: WHEN `min >= 60` THE SYSTEM SHALL `H:MM` (分は 2 桁 0 埋め) を返す (`90` → `"1:30"`, `70` → `"1:10"`, `120` → `"2:00"`)。

## 時刻パース `parseClock(text): number | null`

- REQ-N08: WHEN `text` が `/^\d+:\d+$/` THE SYSTEM SHALL `時*60 + 分` を当日分として返す (`"14:40"` → `880`)。
- REQ-N09: IF `text` が不正形式 THEN THE SYSTEM SHALL `null` を返す。

## 時刻フォーマット `formatClock(min): string`

- REQ-N10: THE SYSTEM SHALL `min` を `H:MM` (時は無パディング, 分 2 桁) で返す (`880` → `"14:40"`, `840` → `"14:00"`)。
- REQ-N11: WHERE `min` が 1440 (24h) 以上 THE SYSTEM SHALL 時を 24 以上のまま表示する (`1500` → `"25:00"`)。深夜跨ぎを破壊しない。

## 累積フォーマット `formatCumulative(min): string`

- REQ-N12: THE SYSTEM SHALL 常に `H:MM` (分 2 桁) で返す (`40` → `"0:40"`, `130` → `"2:10"`, `0` → `"0:00"`)。

## 秒つき時刻 `formatClockSec(minFloat): string`

- REQ-N14: THE SYSTEM SHALL 小数分を受け `H:MM:SS` (分秒 2 桁) で返す。現在時刻の秒表示用 (`840` → `"14:00:00"`, `840 + 46.6/60`... 例 `880.5` → `"14:40:30"`)。負は符号付き。

## ラウンドトリップ不変条件

- REQ-N13: THE SYSTEM SHALL 任意の `min >= 0` について `parseDuration(formatDuration(min)) === min` を満たす。
