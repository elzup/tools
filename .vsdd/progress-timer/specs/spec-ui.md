---
id: spec:ui
title: ProgressTimer UI 振る舞い
coherence:
  depends_on:
    - spec:schedule
    - spec:adjustment
    - spec:share
---

# spec:ui — UI 振る舞い

## 進行表テーブル

- REQ-U01: THE SYSTEM SHALL 各ステップ行に [名前] [配分] [絶対 開始→終了] [累積 開始→終了] を表示する。
- REQ-U02: WHERE 配分セルを編集 THE SYSTEM SHALL spec:schedule の逆算で後続を同期更新する。
- REQ-U03: THE SYSTEM SHALL 行の追加・削除・予定開始時刻の編集を提供する。

## タイマー制御

- REQ-U04: THE SYSTEM SHALL [開始] ボタンで現在時刻を実績起点に固定する (REQ-A01)。
- REQ-U05: WHILE 実績進行中 THE SYSTEM SHALL 1 秒ごとに現在時刻を更新し、現在ステップをハイライトする。
- REQ-U06: THE SYSTEM SHALL 現在ステップの経過/残り/進捗バーを表示する。
- REQ-U07: THE SYSTEM SHALL カスタム開始 (任意時刻を起点に設定) を許可する。

## 実績ずらし

- REQ-U08: THE SYSTEM SHALL 各境界に「左へ N 分 / 右へ N 分」ずらすボタンを提供し shiftBoundary を呼ぶ。
- REQ-U09: THE SYSTEM SHALL 実績行を予定行と視覚的に区別して表示する。

## 共有

- REQ-U10: THE SYSTEM SHALL 共有 URL を生成しクリップボードにコピーできる。
- REQ-U11: WHEN ブラウザAPI(window)非搭載のSSR時 THE SYSTEM SHALL クラッシュしない (dynamic import ssr:false)。
