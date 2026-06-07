# Phase 6: 収束判定 (進行タイマー)

## モード
VCSDD (Lean) — CEG 付き。`ceg.mjs validate` consistent (6 nodes / 10 edges)。

## 敵対的レビュー履歴
- Round 1 (Opus fresh context): 11 findings, 3 次元 FAIL → 全件統合
- Round 2 (Opus fresh context): 11件すべて RESOLVED・回帰ゼロ・総合 PASS。残 LOW 2件 (N-01/N-02) も対応済み

## トレーサビリティ (REQ → TEST → IMPL)

| spec | REQ | TEST | IMPL |
|------|-----|------|------|
| spec:notation | N01-N13 | notation.test.ts | lib/progress-timer/notation.ts |
| spec:schedule | S01-S12 | schedule.test.ts | lib/progress-timer/schedule.ts |
| spec:adjustment | A01-A15 | adjustment.test.ts | lib/progress-timer/adjustment.ts |
| spec:share | SH01-SH09 | share.test.ts | lib/progress-timer/share.ts |
| spec:textproto | TP01-TP10 | textproto.test.ts | lib/progress-timer/textproto.ts |
| design:model | (不変条件) | property.test.ts (fuzz) | lib/progress-timer/types.ts |
| spec:ui | U01-U11 | (手動/型検証) | components/ProgressTimer/* (Timeline 横帯 + 境界ドラッグ + list/text 切替) |

## 追加対応 (ユーザー反復)
- 横タイムライン表示 (予定/実績バー, 配分比例幅) を追加 (components/ProgressTimer/Timeline.tsx)
- 境界の左右ドラッグ調整ハンドル (pointer drag → shiftBoundary)
- テキスト編集モード (配分ベース protocol) + リスト/テキスト切替
- バグ修正: 現在時刻に秒の小数が出る (`15:46.6000...`) → 表示時 Math.floor

## 形式的ハードニング (property-based / fuzz, 各 300 反復)
- notation round-trip: `parseDuration(formatDuration(min)) === min`
- plan 連続性: `absEnd[i] === absStart[i+1]`, `abs = start + cum`, 累積終端 = 合計
- setDuration 非負保証
- actual 連続性: `actualEnd[i] === actualStart[i+1]` (任意 boundaryDeltas)
- shiftBoundary 可逆: `d → -d` で復元
- share round-trip: 特殊文字 (`; , % 日本語 / : → \ "`) 含む name を保存

## 検証結果
- jest: 104 passed (うち progress-timer 58)
- tsc --noEmit: exit 0
- oxlint: 0 warnings / 0 errors
- CEG validate: consistent

## 収束条件
全 REQ がテストにトレース可能、全次元 PASS、孤立ノードなし → **収束**
