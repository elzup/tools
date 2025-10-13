# ページ一覧とアーキテクチャ詳細

このドキュメントは、tools プロジェクトの全ページについて詳細な情報をまとめたテーブルです。

## ページ一覧テーブル

| ページファイル          | カテゴリ    | 機能概要                                      | 主要依存モジュール                            | 依存関係の状態 | SSR 対応     | 備考                   | 総合評価 (1-10) |
| ----------------------- | ----------- | --------------------------------------------- | --------------------------------------------- | -------------- | ------------ | ---------------------- | --------------- |
| index.tsx               | Top         | ホームページ - ツール集のランディングページ   | @fortawesome/react-fontawesome, @mui/material | 現在           | CSR          | トップページ           | 6               |
| pikbl-memo.tsx          | Tool/Game   | ピクミンブルームのデコピクミンメモアプリ      | dynamic import, styled-components             | 現在           | **SSR 無効** | PWA 対応               | 8               |
| char-counter.tsx        | Tool/Game   | 文字カウント - 絵文字対応の文字頻度解析ツール | punycode, @mui/material                       | 現在           | CSR          | Unicode 対応           | 5               |
| nigate-typing.tsx       | Tool/Game   | 苦手タイピング練習ツール                      | dynamic import                                | 現在           | **SSR 無効** | インタラクティブゲーム | 7               |
| clipsh.tsx              | Tool/Game   | クリップボード共有ツール                      | styled-components                             | 現在           | CSR          | PWA 対応               | 8               |
| dynamic-va.tsx          | Tool/Game   | 動体視力トレーニングゲーム                    | @elzup/kit, @mui/material, react-use          | 現在           | CSR          | -                      | 5               |
| code-explorer.tsx       | Tool/Game   | コード探索・解析ツール                        | dynamic import                                | 現在           | **SSR 無効** | PWA 対応               | 9               |
| devtools-camp.tsx       | Tool/Game   | DevTools キャンプ - 開発者ツール練習          | devtools-detect, rooks, @mui/material         | 現在           | CSR          | -                      | 6               |
| time-clip.tsx           | Tool/Game   | 時間クリップツール                            | @mui/material, styled-components              | 現在           | CSR          | ローカルストレージ使用 | 5               |
| script-buttons.tsx      | Tool/Game   | スクリプトボタン実行ツール                    | @mui/material, styled-components              | 現在           | CSR          | ローカルストレージ使用 | 5               |
| text-transformer.tsx    | Tool/Game   | テキスト変換ツール                            | @mui/material, カスタムライブラリ             | 現在           | CSR          | 複数変換機能           | 6               |
| scope-timer.tsx         | Tool/Game   | スコープタイマー - ミリ秒精度の実験用タイマー | React 基本機能のみ                            | 現在           | CSR          | ミリ秒表示             | 7               |
| 1px.tsx                 | DevTool     | 1px の画像データ URL 生成ツール               | react-color, @mui/material                    | 現在           | CSR          | カラーピッカー使用     | 4               |
| global-ip.tsx           | DevTool     | グローバルパブリック IP 取得ツール            | fetch API                                     | 現在           | CSR          | 外部 API 使用          | 3               |
| pi-lab.tsx              | Math        | モンテカルロ法による π 計算実験               | @mui/material                                 | 現在           | CSR          | 数学シミュレーション   | 4               |
| mandelbulb.tsx          | Math        | マンデルブロ集合可視化ツール                  | @mui/material, カスタムフック                 | 現在           | CSR          | 数学的可視化           | 5               |
| collatz-graph.tsx       | Math        | コラッツ予想グラフ可視化                      | React 基本機能のみ                            | 現在           | CSR          | 数学的グラフ           | 4               |
| frag-problab.tsx        | Math        | フラグメント確率実験                          | @mui/material                                 | 現在           | CSR          | 確率シミュレーション   | 4               |
| noopener.tsx            | Security    | noopener デモ - セキュリティ実演              | @mui/material                                 | 現在           | CSR          | セキュリティ教育       | 3               |
| xss.tsx                 | Security    | XSS デモ - クロスサイトスクリプティング実演   | prettier, prettier/parser-html                | **レガシー**   | CSR          | セキュリティ教育       | 3               |
| hard-confirm.tsx        | Security    | Submit ループ - UI/UX 実験                    | @mui/material                                 | 現在           | CSR          | UX 実験                | 3               |
| sub-window-ex.tsx       | Experiments | サブウィンドウダンプ実験                      | dynamic import                                | 現在           | **SSR 無効** | ブラウザ API 実験      | 4               |
| key-event-master.tsx    | Experiments | キーイベントデモ                              | dynamic import                                | 現在           | **SSR 無効** | キーボードイベント     | 4               |
| mermaid-ui.tsx          | Experiments | Mermaid UI - ダイアグラム生成                 | dynamic import, mermaid                       | **レガシー**   | **SSR 無効** | 図表生成               | 6               |
| svg-play.tsx            | Art         | SVG プレイグラウンド                          | React 基本機能のみ                            | 現在           | CSR          | SVG 実験               | 4               |
| divergence-meter.tsx    | Art         | ダイバージェンスメーター表示                  | @mui/material                                 | 現在           | CSR          | アニメ風表示           | 5               |
| shingeki.tsx            | Art         | 進撃プロット可視化                            | dynamic import, styled-components             | 現在           | **SSR 無効** | データ可視化           | 5               |
| million-learn-tech.tsx  | Art         | ミリオン学習技術デモ                          | dynamic import                                | 現在           | **SSR 無効** | 教育技術               | 5               |
| gl-bit-counter.tsx      | Graphical   | 3D ビットカウンター                           | @react-three/drei, @react-three/fiber, three  | **要更新**     | CSR          | 3D グラフィックス      | 4               |
| creative-coding.tsx     | Graphical   | クリエイティブコーディングプレイグラウンド    | dynamic import, react-p5, p5                  | **要更新**     | **SSR 無効** | P5.js 使用             | 4               |
| word-search.tsx         | ProtoType   | 単語検索ゲーム                                | @mui/material                                 | 現在           | CSR          | ゲームプロトタイプ     | 5               |
| ellip-billiards.tsx     | ProtoType   | 楕円ビリヤードシミュレーション                | matter-js                                     | **要更新**     | CSR          | 物理シミュレーション   | 4               |
| cryptowat-chart.tsx     | ProtoType   | 暗号通貨チャート表示                          | dynamic import                                | 現在           | **SSR 無効** | チャート表示           | 5               |
| diginima.tsx            | ProtoType   | デジニマ - デジタル実験                       | React 基本機能のみ                            | 現在           | CSR          | プロトタイプ           | 3               |
| decimal.tsx             | ProtoType   | 十進数表示実験                                | @elzup/kit                                    | 現在           | CSR          | 数値表示               | 3               |
| magironic.tsx           | ProtoType   | マジロニック - 魔法的インターフェース         | カスタムコンポーネント                        | 現在           | CSR          | UI 実験                | 4               |
| speecher.tsx            | ProtoType   | スピーチャー - 音声関連ツール                 | dynamic import                                | 現在           | **SSR 無効** | 音声処理               | 7               |
| mirror.tsx              | Closed      | ミラーカメラ - カメラミラーリング             | react-webcam, @mui/material                   | **要更新**     | CSR          | カメラ使用             | 3               |
| gha-badge-maker.tsx     | Closed      | GitHub Actions バッジメーカー                 | @mui/material                                 | 現在           | CSR          | バッジ生成             | 4               |
| kotobaru.tsx            | リンクなし  | 言葉遊びツール                                | styled-components                             | 現在           | CSR          | PWA 対応               | 4               |
| ehou.tsx                | リンクなし  | 恵方表示ツール                                | React 基本機能のみ                            | 現在           | CSR          | 季節ツール             | 2               |
| playground-p5.tsx       | リンクなし  | P5.js プレイグラウンド                        | dynamic import, react-p5, p5                  | **要更新**     | **SSR 無効** | P5.js 実験             | 4               |
| custom-ratio-graph.tsx  | リンクなし  | カスタム比率グラフ作成                        | @mui/material                                 | 現在           | CSR          | グラフ作成             | 4               |
| d3-play.tsx             | リンクなし  | D3.js 実験プレイグラウンド                    | @elzup/kit, lodash, styled-components         | 現在           | CSR          | データ可視化実験       | 5               |
| debug.tsx               | リンクなし  | デバッグ用ツール                              | @elzup/kit                                    | 現在           | CSR          | 開発用                 | 2               |
| normal-distribution.tsx | リンクなし  | 正規分布ツール                                | react-google-charts, @mui/material            | **要更新**     | CSR          | 統計計算               | 3               |
| random.tsx              | リンクなし  | ランダム検査ツール                            | @elzup/kit                                    | 現在           | CSR          | 乱数検証               | 3               |
| splatoonament-cost.tsx  | リンクなし  | スプラトゥーンメント費用計算                  | @mui/material, styled-components              | 現在           | CSR          | ゲーム関連計算         | 3               |
| qr-form.tsx             | リンクなし  | QR フォーム生成                               | カスタムコンポーネント                        | 現在           | CSR          | QR コード生成          | 4               |
| continus-scan.tsx       | リンクなし  | 連続スキャンツール                            | html5-qrcode                                  | **要更新**     | CSR          | QR コードスキャン      | 3               |
| noopener-attacker.tsx   | リンクなし  | noopener 攻撃者ページ                         | @mui/material                                 | 現在           | CSR          | セキュリティ実験       | 2               |

## 依存関係の状態について

### レガシー・要更新モジュール

- **mermaid (8.13.6 → 11.12.0)**: メジャーバージョンアップ必要
- **prettier (2.8.8 → 3.6.2)**: メジャーバージョンアップ必要
- **react-google-charts (4.0.7 → 5.2.1)**: マイナーアップデート推奨
- **matter-js (0.18.0 → 0.20.0)**: マイナーアップデート推奨
- **p5/react-p5 (1.9.0 → 2.0.5)**: メジャーバージョンアップ必要
- **three.js (0.154.0 → 0.180.0)**: アップデート推奨
- **react-webcam**: バージョン確認推奨
- **html5-qrcode**: バージョン確認推奨

### Next.js 関連

- **Next.js (13.0.2 → 15.5.4)**: メジャーアップデート必要
- **React (18.2.0 → 19.2.0)**: メジャーアップデート検討

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

これらはブラウザ API や重いライブラリ（P5.js、Three.js 等）を使用するため、SSR が無効化されています。

## アーキテクチャ上の特徴

1. **PWA 対応**: pikbl-memo.tsx, clipsh.tsx, code-explorer.tsx, kotobaru.tsx
2. **3D/Canvas**: Three.js、P5.js 使用ページ群
3. **外部 API 使用**: global-ip.tsx（ipify API）
4. **ローカルストレージ活用**: 複数のツールページ
5. **セキュリティ教育**: XSS、noopener 関連のデモページ群
6. **数学・可視化**: 統計、幾何学、グラフ理論の実装例
