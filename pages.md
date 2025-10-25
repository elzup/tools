# ページ一覧とアーキテクチャ詳細

このドキュメントは、tools プロジェクトの全ページについて詳細な情報をまとめたテーブルです。

## ページ一覧テーブル

| ページファイル          | カテゴリ     | 機能概要                                      | 主要依存モジュール                    | 依存関係の状態 | SSR | 備考                   | RANK |
| ----------------------- | ------------ | --------------------------------------------- | ------------------------------------- | -------------- | --- | ---------------------- | ---- |
| index.tsx               | Top          | ホームページ - ツール集のランディングページ   | @fortawesome, @mui                    | 現在           |     | トップページ           | 6    |
| pikbl-memo.tsx          | Tool/Game    | ピクミンブルームのデコピクミンメモアプリ      | styled-components                     | 現在           | \*  | PWA 対応               | 8    |
| char-counter.tsx        | Tool/Game    | 文字カウント - 絵文字対応の文字頻度解析ツール | punycode, @mui                        | 現在           |     | Unicode 対応           | 5    |
| nigate-typing.tsx       | Tool/Game    | 苦手タイピング練習ツール                      |                                       | 現在           | \*  | インタラクティブゲーム | 7    |
| dynamic-va.tsx          | Tool/Game    | 動体視力トレーニングゲーム                    | @elzup/kit, @mui, react-use           | 現在           |     | -                      | 5    |
| devtools-camp.tsx       | Tool/Game    | DevTools キャンプ - 開発者ツール練習          | devtools-detect, rooks, @mui          | 現在           |     | -                      | 6    |
| script-buttons.tsx      | Tool/Game    | スクリプトボタン実行ツール                    | @mui, styled-components               | 現在           |     | ローカルストレージ使用 | 5    |
| scope-timer.tsx         | Tool/Game    | スコープタイマー - ミリ秒精度の実験用タイマー |                                       | 現在           |     | ミリ秒表示             | 7    |
| 1px.tsx                 | DevTool      | 1px の画像データ URL 生成ツール               | react-color, @mui                     | 現在           |     | カラーピッカー使用     | 4    |
| global-ip.tsx           | DevTool      | グローバルパブリック IP 取得ツール            | fetch API                             | 現在           |     | 外部 API 使用          | 3    |
| code-explorer.tsx       | DevTool      | コード探索・解析ツール                        |                                       | 現在           | \*  | PWA 対応               | 9    |
| clipsh.tsx              | DevTool      | クリップボード共有ツール                      | styled-components                     | 現在           |     | PWA 対応               | 8    |
| time-clip.tsx           | DevTool      | 時間クリップツール                            | @mui, styled-components               | 現在           |     | ローカルストレージ使用 | 5    |
| text-transformer.tsx    | DevTool      | テキスト変換ツール                            | @mui                                  | 現在           |     | 複数変換機能           | 6    |
| pi-lab.tsx              | Math         | モンテカルロ法による π 計算実験               | @mui                                  | 現在           |     | 数学シミュレーション   | 4    |
| mandelbulb.tsx          | Math         | マンデルブロ集合可視化ツール                  | @mui                                  | 現在           |     | 数学的可視化           | 5    |
| collatz-graph.tsx       | Math         | コラッツ予想グラフ可視化                      |                                       | 現在           |     | 数学的グラフ           | 4    |
| frag-problab.tsx        | Math         | フラグメント確率実験                          | @mui                                  | 現在           |     | 確率シミュレーション   | 4    |
| normal-distribution.tsx | Math         | 正規分布ツール                                | react-google-charts, @mui             | **要更新**     |     | 統計計算               | 3    |
| custom-ratio-graph.tsx  | Math         | カスタム比率グラフ作成                        | @mui                                  | 現在           |     | グラフ作成             | 4    |
| noopener.tsx            | Security     | noopener デモ - セキュリティ実演              | @mui                                  | 現在           |     | セキュリティ教育       | 3    |
| xss.tsx                 | Security     | XSS デモ - クロスサイトスクリプティング実演   | prettier                              | **レガシー**   |     | セキュリティ教育       | 3    |
| hard-confirm.tsx        | Security     | Submit ループ - UI/UX 実験                    | @mui                                  | 現在           |     | UX 実験                | 3    |
| sub-window-ex.tsx       | Experiments  | サブウィンドウダンプ実験                      |                                       | 現在           | \*  | ブラウザ API 実験      | 4    |
| key-event-master.tsx    | Experiments  | キーイベントデモ                              |                                       | 現在           | \*  | キーボードイベント     | 4    |
| mermaid-ui.tsx          | Experiments  | Mermaid UI - ダイアグラム生成                 | mermaid                               | **レガシー**   | \*  | 図表生成               | 6    |
| random.tsx              | Experiments  | ランダム検査ツール                            | @elzup/kit                            | 現在           | \*  | 乱数検証               | 3    |
| svg-play.tsx            | Art          | SVG プレイグラウンド                          |                                       | 現在           |     | SVG 実験               | 4    |
| divergence-meter.tsx    | Art          | ダイバージェンスメーター表示                  | @mui                                  | 現在           |     | アニメ風表示           | 5    |
| shingeki.tsx            | Art          | 進撃プロット可視化                            | styled-components                     | 現在           | \*  | データ可視化           | 5    |
| creative-coding.tsx     | Graphical    | クリエイティブコーディングプレイグラウンド    | react-p5, p5                          | **要更新**     | \*  | P5.js 使用             | 4    |
| d3-play.tsx             | Graphical    | D3.js 実験プレイグラウンド                    | @elzup/kit, lodash, styled-components | 現在           |     | データ可視化実験       | 5    |
| word-search.tsx         | ProtoType    | 単語検索ゲーム                                | @mui                                  | 現在           |     | ゲームプロトタイプ     | 5    |
| ellip-billiards.tsx     | ProtoType    | 楕円ビリヤードシミュレーション                | matter-js                             | **要更新**     |     | 物理シミュレーション   | 4    |
| diginima.tsx            | ProtoType    | デジニマ - デジタル実験                       |                                       | 現在           |     | プロトタイプ           | 3    |
| decimal.tsx             | ProtoType    | 十進数表示実験                                | @elzup/kit                            | 現在           |     | 数値表示               | 3    |
| magironic.tsx           | ProtoType    | マジロニック - 魔法的インターフェース         |                                       | 現在           |     | UI 実験                | 4    |
| bit-mixer.tsx           | ProtoType    | Bit Mixer - 8bit合成ツール                    | @mui                                  | 現在           |     | ビット演算実験         | 5    |
| speecher.tsx            | ProtoType    | スピーチャー - 音声関連ツール                 |                                       | 現在           | \*  | 音声処理               | 7    |
| mirror.tsx              | Closed       | ミラーカメラ - カメラミラーリング             | react-webcam, @mui                    | **要更新**     |     | カメラ使用             | 3    |
| gha-badge-maker.tsx     | Closed       | GitHub Actions バッジメーカー                 | @mui                                  | 現在           |     | バッジ生成             | 4    |
| debug.tsx               | Secret Tools | デバッグ用ツール                              | @elzup/kit                            | 現在           |     | 開発用                 | 2    |
| playground-p5.tsx       | Secret Tools | P5.js プレイグラウンド                        | react-p5, p5                          | **要更新**     | \*  | P5.js 実験             | 4    |
| kotobaru.tsx            | Secret Tools | 言葉遊びツール                                | styled-components                     | 現在           |     | PWA 対応               | 4    |
| qr-form.tsx             | Secret Tools | QR フォーム生成                               |                                       | 現在           |     | QR コード生成          | 4    |
| splatoonament-cost.tsx  | Secret Tools | スプラトゥーンメント費用計算                  | @mui, styled-components               | 現在           |     | ゲーム関連計算         | 3    |
| cryptowat-chart.tsx     | Secret Tools | 暗号通貨チャート表示                          |                                       | 現在           | \*  | チャート表示           | 5    |
| million-learn-tech.tsx  | Secret Tools | ミリオン学習技術デモ                          |                                       | 現在           | \*  | 教育技術               | 5    |
| ehou.tsx                | メニューなし | 恵方表示ツール                                |                                       | 現在           |     | 季節ツール             | 2    |
| continus-scan.tsx       | メニューなし | 連続スキャンツール                            | html5-qrcode                          | **要更新**     |     | QR コードスキャン      | 3    |
| flow2chat.tsx           | メニューなし | フロー to チャット変換                        | react-flow-renderer, elkjs            | 現在           |     | フローチャート         | 4    |
| noopener-attacker.tsx   | メニューなし | noopener 攻撃者ページ                         | @mui                                  | 現在           |     | セキュリティ実験       | 2    |

## 依存関係の状態について

### レガシー・要更新モジュール

- **mermaid (8.13.6 → 11.12.0)**: メジャーバージョンアップ必要
- **prettier (2.5.1 → 3.6.2)**: メジャーバージョンアップ必要
- **react-google-charts (4.0.0 → 5.2.1)**: マイナーアップデート推奨
- **matter-js (0.18.0 → 0.20.0)**: マイナーアップデート推奨
- **p5/react-p5 (1.9.0 → 2.0.5)**: メジャーバージョンアップ必要
- **react-webcam**: バージョン確認推奨
- **html5-qrcode**: バージョン確認推奨

### Next.js 関連

- **Next.js (15.5.4)**: 最新版
- **React (18.2.0)**: 安定版使用中

### SSR 無効化されているページ

以下のページは`ssr: false`により、クライアントサイドでのみレンダリングされます：

- pikbl-memo.tsx
- nigate-typing.tsx
- code-explorer.tsx
- key-event-master.tsx
- speecher.tsx
- shingeki.tsx
- playground-p5.tsx
- million-learn-tech.tsx
- mermaid-ui.tsx
- sub-window-ex.tsx
- creative-coding.tsx
- cryptowat-chart.tsx
- random.tsx

これらはブラウザ API や重いライブラリ（P5.js 等）を使用するため、SSR が無効化されています。

## アーキテクチャ上の特徴

1. **PWA 対応**: pikbl-memo.tsx, clipsh.tsx, code-explorer.tsx, kotobaru.tsx
2. **Canvas/グラフィックス**: P5.js 使用ページ群
3. **外部 API 使用**: global-ip.tsx（ipify API）
4. **ローカルストレージ活用**: 複数のツールページ
5. **セキュリティ教育**: XSS、noopener 関連のデモページ群
6. **数学・可視化**: 統計、幾何学、グラフ理論の実装例
