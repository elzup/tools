---
id: spec:textproto
title: 配分ベースのテキスト protocol (encode/decode)
coherence:
  depends_on:
    - design:model
    - spec:notation
---

# spec:textproto — テキスト編集モードの相互変換

リスト/タイムライン編集とテキスト編集を切り替えるための、人が読み書きしやすい行指向 protocol。**配分表記を主**とする。

## 書式

```
@14:00          # 開始時刻 (省略可, @ 始まり)
stepA 40        # <名前> <配分>  (配分は末尾トークン)
stepB 1:30
本編 開始 0:20  # 名前に空白可 (末尾トークンが配分)
1:10            # 名前省略時は配分のみ
```

## encode `encodePlanText(plan): string`

- REQ-TP01: THE SYSTEM SHALL 1 行目に `@<開始時刻>` (formatClock) を出力する。
- REQ-TP02: THE SYSTEM SHALL 各ステップを 1 行 `<name> <配分>` で出力する。配分は formatDuration。`name` が空なら配分のみ。

## decode `decodePlanText(text, fallbackStart=0): PlanState`

- REQ-TP03: WHEN 行が `@` で始まる THE SYSTEM SHALL 残りを parseClock し開始時刻に設定する (複数あれば最後が有効, 不正は無視)。
- REQ-TP04: WHEN ステップ行の**末尾トークン**が配分として有効 THE SYSTEM SHALL それを durationMin、残りを name とする。
- REQ-TP05: IF 末尾トークンが配分として不正 THEN THE SYSTEM SHALL 行全体を name、durationMin=0 とする (編集途中の行を捨てない)。
- REQ-TP06: THE SYSTEM SHALL 空行・空白のみ行をスキップする。
- REQ-TP07: WHERE `@` 行が無い THE SYSTEM SHALL `fallbackStart` を開始時刻に用いる。
- REQ-TP08: THE SYSTEM SHALL 復元ステップに一意 id を付与する。
- REQ-TP09: THE SYSTEM SHALL 例外を投げない (どんな入力でも PlanState を返す)。

## ラウンドトリップ

- REQ-TP10: THE SYSTEM SHALL `decodePlanText(encodePlanText(p))` が `p` の startClockMin / 各 durationMin / 各 name を保存することを満たす (id を除く)。末尾トークンが常に配分であるため名前に数字・空白を含んでも壊れない。
