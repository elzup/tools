---
title: WASM を同梱した npm ライブラリで、.wasm ファイルはどこを通ってブラウザに届くか
status: draft
created: 2026-11-20
page: /wasm-library-distribution
---

# WASM を同梱した npm ライブラリで、.wasm ファイルはどこを通ってブラウザに届くか

JS だけのライブラリなら「npm に置けば、利用者のバンドラーが混ぜてくれる」で済む。
WASM を同梱すると `.wasm` というバイナリファイルが関わるため、関わる場所が 5 つに分かれ、それぞれで壊れ方が違う。

## 配布フロー図

ページ (`/wasm-library-distribution`) では 1 枚の SVG 図として描く。構成:

- **列 (環境)**: ① build 前 (ソース) | ① build 後 (生成物) | ② registry (npm publish) | ③ 利用者 dev (pnpm add) | ④ 公開 Web (bundle + deploy) | ⑤ browser (fetch + compile)
- **責任ゾーン**: 作者 (①の 2 列) / npm (②) / 利用者 (③④) / 来訪者 (⑤)
- **行 (ファイル)**: lib.rs / loader.ts→wasm.js / index.ts→\*.js / x.wasm / package.json→tgz
- **カード**: 各行の初登場セルに「ファイル名・TXT/BIN・中身の例・持つ情報」のカード
- **minify で変形するセル** (④ の JS 2 行) も中身の例を表示
- **接続線**: 影響し合うセル同士を結ぶ (下記)
- **列の注記**: 各列の下部に「情報構造」「壊れやすい所」

```
         ① build 前   ① build 後    ② registry    ③ dev        ④ Web        ⑤ browser
         │ 作者 ──────────────────────────────────────────────────│ 利用者 ─────│ 来訪者
lib.rs   [カード]                                │              │              │              │
            └─ build (cargo + wasm-opt) ──────────────────────→ x.wasm 生成     │              │
loader.ts [カード] → wasm.js → tgz 内 → node_modules → minify 例               │              │
            └ new URL('./x.wasm') 位置参照 ┐              └ URL 書き換え ↓      │              │
index.ts  [カード] → index.js → tgz 内 → node_modules → minify 例               │              │
x.wasm   (まだ無い)  [カード] → tgz 内 → 展開コピー → x-9c2e.wasm → 線形メモリ
package.json [カード] ─ files:["lib"] ─→ [tgz カード] → tar 展開 (pnpm add)     │              │

列の注記 (情報構造 / 壊れやすい所):
  ①前: 人が読むテキストが正本 / ツールチェーン (CI も同じ版)
  ①後: バイナリは派生物 (git 管理外・再生成可能)
  ②:  immutable スナップショット。再コンパイルされない
  ③:  まだ実行されない。バンドラー解析対象 / new URL を解決できるか (CJS 不可)
  ④:  静的ファイル群。別リクエスト +1 / Content-Type wasm 必須、CSP wasm-unsafe-eval
  ⑤:  ここで初めて実行状態 / 失敗は JS 版で吸収
```

### カードの中身 (初登場セル)

| ファイル           | 種類 | 中身の例                                                        | 持つ情報                                                   |
| ------------------ | ---- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| `wasm/src/lib.rs`  | TXT  | `#[wasm_bindgen] pub fn step(ptr: usize, n: usize, dt: f32) {`  | 計算ロジックの正本。配布管を流れる情報の源                 |
| `src/loader.ts`    | TXT  | `await fetch(new URL('./x.wasm', import.meta.url))`             | .wasm の位置解決 + 初期化手順。配布後も wasm.js として残る |
| `src/index.ts`     | TXT  | `export function createEngine(opts: Options): Engine { … }`     | JS 版実装と公開 API の形。フォールバック兼                 |
| `package.json`     | TXT  | `"files": ["lib"], "exports": { … }`                            | 配布ルール。何を同梱しどの入口を公開するか                 |
| `lib/esm/x.wasm`   | BIN  | `00 61 73 6d 01 00 00 00 …` (\0asm + バージョン + セクション列) | 機械語 (バイトコード)。人は読めないが実行に必要な全情報    |
| `my-lib-x.y.z.tgz` | BIN  | `1f 8b 08 00 …` (gzip ヘッダ)                                   | 「バージョン x.y.z = この中身」の対応付け                  |

### 変形を示すセル (minify / リネーム)

- ④ の JS セル: minify 後のコード例
  - loader 行: `const e=await fetch("/assets/x-9c2e.wasm"),t=await WebAssembly.instantiateStreaming(e)` (URL が書き換わっている)
  - index 行: `function createEngine(e){ return new Engine(e)}`
- x.wasm 行: `x-9c2e.wasm` (hash リネーム・中身同一) → `線形メモリへ展開` (`0000  00 00 80 3f …`)

### 接続線 (影響し合うもの)

| from → to                                | ラベル                           |
| ---------------------------------------- | -------------------------------- |
| lib.rs (①前) → x.wasm (①後)              | build (cargo + wasm-opt)         |
| loader.ts (①前) → x.wasm (①後)           | `new URL('./x.wasm')` で位置参照 |
| package.json (①前) → tgz (②)             | `files: ["lib"]` で同梱          |
| tgz (②) → tar 展開セル (③)               | tar 展開 (pnpm add)              |
| loader minify セル (④) → x-9c2e.wasm (④) | URL 書き換え                     |
| x-9c2e.wasm (④) → 線形メモリ (⑤)         | fetch + instantiateStreaming     |

## JS だけのライブラリとの違い

| 項目                    | JS だけ                        | WASM を同梱                                                                   |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| パッケージの中身        | `lib/esm` / `lib/cjs` / 型定義 | + `.wasm` バイナリ                                                            |
| 読み込み                | `import` した時点で使える      | 取得 + コンパイルが非同期                                                     |
| API                     | 同期で返せる                   | `await` が要る。または JS 版で先に動かし、後から差し替える                    |
| ファイル位置の解決      | 不要                           | `new URL('./x.wasm', import.meta.url)`。CJS では `import.meta.url` が使えない |
| base64 で JS に埋め込む | —                              | 位置の問題は消えるがサイズ約 1.33 倍。非同期は残る                            |
| CDN から 1 行           | そのまま動く                   | 同じ場所から配信されるので動く。リクエストは 1 回増える                       |
| CSP                     | 制約なし                       | `'wasm-unsafe-eval'` が要る                                                   |
| ビルドと CI             | `tsc` だけ                     | Rust 等のツールチェーンが増える                                               |
| デバッグ                | DevTools でそのまま            | 追いにくい。テストは JS 版と結果が一致するかの比較が中心                      |
