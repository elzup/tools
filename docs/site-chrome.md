# anozon site chrome spec

anozon 系サイト (anozon.me / tools / mathkb) で **レイアウト骨格とサイト間ナビゲーションだけ**を揃えるための正本。

- **揃えるもの**: ヘッダー・フッターの構造と寸法、要素の並び、サイトスイッチャー、コンテナ幅、本文パディング。
- **揃えないもの**: テーマカラー、ロゴマーク、フォント、ページ本体のデザイン。サイトごとの個性は残す。
- **実装方式**: 共有 npm パッケージは作らない。各リポが自分のスタック (tools = MUI + styled-components / math-kb = open-props な素 CSS) でこの spec に合わせて実装する。
  → 決断 D-0010 (math-kb `.metarc/log/events.jsonl`)

## 1. サイト一覧 (site switcher の中身)

各リポの `src/data/sites.ts` に同じ内容を持つ。並び順もこの順で固定する。

| id | label | href | icon (react-icons/fa) |
| --- | --- | --- | --- |
| `me` | anozon.me | https://anozon.me | `FaGlobe` |
| `tools` | tools | https://tools.anozon.me | `FaTools` |
| `mathkb` | mathkb | https://mathkb.anozon.me | `FaSquareRootAlt` |

- 自サイト (`SITE_ID` と一致する行) はスイッチャーに出さない。
- アイコンは react-icons/fa で統一する (tools のロゴのみ FontAwesome の `faSatellite` を継続使用)。
- サイトを増やしたらこの表と各リポの `sites.ts` を同時に更新する。

## 2. ヘッダー

```
┌─ sticky, top:0 ────────────────────────────────────────────────┐
│ [mark] anozon /site            [site固有] [switcher] [GitHub] [theme] │
└────────────────────────────────────────────────────────────────┘
```

| 項目 | 値 |
| --- | --- |
| position | `sticky; top: 0`。z-index はサイト固有の header レイヤに載せる (math-kb は 10、tools は MUI `appBar` の 1100)。サイトをまたいで重なることはないので値は揃えない |
| 高さ | トップページ **64px** / それ以外 **48px** (compact) |
| 横 padding | 64px 時 24px / compact 時 16px |
| 背景 | サイト固有 (単色でもグラデでも可)。文字色は白系 |
| ロゴ | `/` へのリンク。mark (24px / compact 20px) + `anozon` (weight 700, letter-spacing -0.5px) + `/<site>` (weight 300, opacity 0.8) |
| 右側の並び | **サイト固有ウィジェット → サイトスイッチャー → GitHub → テーマトグル** の順で固定 |
| 右側の gap | 8px |
| hover | `opacity: 0.85` (ベース 0.8 → 1.0) |

- サイト固有ウィジェットの例: tools の `Clock`。無いサイトは詰めるだけで並びは変えない。
- テーマトグルが無いサイトは省略してよい (並び順は維持)。
- ロゴが `/` に戻るので、別途 Home ボタンは置かない。

## 3. サイトスイッチャー

- 兄弟サイトへのアイコンリンクを横並び。gap 8px。
- `>= 640px` ではアイコンの右にラベル (`font-size: 0.875rem`, weight 500) を出す。それ未満はアイコンのみ。
- 色は `header-text-muted` 相当 (白 70%)、hover で不透明。
- ヘッダーとフッターの両方に同じコンポーネントを置く (フッターでは常にラベルを出す)。

## 4. フッター

`mode` を 3 つ持つ。トップページは `full`、その他のページは `minimal`。

| mode | 中身 | padding |
| --- | --- | --- |
| `full` | ページメニュー → divider (`rgba(255,255,255,.1)`, 上下 2rem) → bottom row | `3rem 0 2rem` |
| `minimal` | 1 行: 左に `anozon/<site>` + サイトスイッチャー + GitHub、右に chevron。chevron でページメニューを展開 | `0.75rem 0` |
| `hidden` | 何も出さない | — |

- 背景はヘッダーと同じサーフェス、`color: #fff`、`margin-top: auto`。
- bottom row: 左に tagline (opacity 0.7)、右に外部リンク (anozon.me / GitHub)。`max-width: 600px` で縦積み + 中央寄せ。
- **ページメニューはフッターが持つ。** トップページの本文にはヒーローだけを置き、メニューを二重に出さない。

## 5. ページメニュー

| 項目 | 値 |
| --- | --- |
| レイアウト | `grid`, 4 列 / `<=900px` 3 列 / `<=600px` 2 列, gap 1.5rem |
| グループ見出し | `0.75rem`, weight 600, `text-transform: uppercase`, `letter-spacing: .5px`, opacity 0.5, 下 margin 0.75rem |
| 項目 | アイコン (1rem, opacity .7) + ラベル (`0.875rem`, opacity .85 → hover 1.0), `padding: 4px 0`, gap 8px |

## 6. コンテナと本文

左右のガターは「コンテナの padding」と「main の padding」の二重掛けになりやすいので、
**実装手段ではなく実効値で揃える** (MUI Container + Main padding でも素の CSS でも同じ見た目になる)。

| 項目 | 値 |
| --- | --- |
| コンテナ最大幅 | **1200px** (MUI の `maxWidth="lg"` と同値)、`margin-inline: auto` |
| ページ全体 | `min-height: 100vh; display: flex; flex-direction: column`、main は `flex: 1` |
| 本文の左右ガター (実効値) | **16px** → `>=600px` **28px** → `>=900px` **48px** |
| 本文の上下パディング | `1.5rem` → `>=600px` `2rem` → `>=900px` `2.5rem` |
| flush 指定時 | 左右 `2px` → `6px` → `8px` / 上下 `1rem` → `1.25rem` → `1.5rem` (スクショ等で横幅を使い切りたいページ用) |

- tools はこの実効値を MUI `Container` の `px: {xs: 0, sm: 2, md: 3}` と `Main` の `padding` の合算で出している。
- 内訳が違っても実効値が合っていれば spec 準拠とする。

## 実装状況

| サイト | ヘッダー | スイッチャー | フッター | コンテナ |
| --- | --- | --- | --- | --- |
| tools | ✅ | ✅ | ✅ | ✅ |
| math-kb | ✅ | ✅ | ✅ | ✅ |
| anozon.me | 未 | 未 | 未 | 未 |

- tools: 2026-09-12 に spec 準拠 (sticky 64/48px、Clock → switcher → GitHub、footer top=full / 他=minimal、実効ガター 16/28/48)。
- math-kb: 2026-09-12 に spec 準拠 (SiteSwitch / SiteFooter、sticky 64/48px、コンテナ 1200px + ガター 16/28/48、PageMenu をフッターへ移設)。
