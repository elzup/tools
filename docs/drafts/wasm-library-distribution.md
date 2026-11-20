---
title: (草案) WASM を同梱した npm ライブラリで、.wasm ファイルはどこを通ってブラウザに届くか
status: draft
created: 2026-11-20
context: particle-life-bg (https://github.com/elzup/particle-life-bg) に WASM の計算部分を足すかを検討したときの整理
---

# WASM を同梱した npm ライブラリで、.wasm ファイルはどこを通ってブラウザに届くか

> 草案。数値・バンドラーごとの挙動は記事にする前に実測・一次資料で確かめる (TODO 印)。

## きっかけ

Canvas に Particle Life を描く背景ライブラリ [particle-life-bg](https://github.com/elzup/particle-life-bg) を作っている。
計算部分 (粒子数 × 近傍数のループ) を WASM にすれば速くなるか、を考えたとき、
速さより先に「`.wasm` という JS ではないファイルを、利用者のブラウザまでどう届けるか」の方が論点が多いと気づいた。

JS だけのライブラリなら「npm に置けば、利用者のバンドラーが混ぜてくれる」で終わる。
WASM を入れると、関わる場所が 5 つに分かれ、それぞれで壊れ方が違う。

## 5 つの場所

```
① ライブラリの開発環境   particle-life-bg/
   wasm/src/lib.rs               ← 計算部分の正本 (Rust)。git 管理
   src/wasm.ts                   ← .wasm を探して読み込み、JS 版と同じ形の API で包む。git 管理
   src/sim.ts                    ← JS 版 (比較の基準 + 失敗時の代わり)
        │ pnpm build  (= cargo build --target wasm32 → wasm-opt → tsc)
        ▼
   lib/esm/wasm.js               ┐
   lib/esm/sim.wasm   ★ここで生成 ├ 生成物。git 管理外 (.gitignore の lib/)
   lib/cjs/… lib/types/…         ┘
        │ npm publish  ("files": ["lib/"] で同梱)
        ▼
② 配布物   npm registry: particle-life-bg-x.y.z.tgz
   package/lib/esm/wasm.js
   package/lib/esm/sim.wasm      ← バイナリがそのまま入る。利用者側で再コンパイルはしない
   package.json  "exports": { "./wasm": "./lib/esm/wasm.js", … }
        │ 利用者が pnpm add particle-life-bg
        ▼
③ 利用者の開発環境   their-app/
   node_modules/particle-life-bg/lib/esm/sim.wasm    ← ②が展開されるだけ。まだ誰も使っていない
   src/App.tsx   import { wasmEngine } from 'particle-life-bg/wasm'
        │ 利用者のバンドラー (Vite / webpack / Next) が
        │ new URL('./sim.wasm', import.meta.url) を見つけ、
        │ .wasm を「画像と同じ静的ファイル」として出力先にコピーし、名前にハッシュを付ける
        ▼
④ 利用者が配布する Web   their-app/dist/ → CDN・静的ホスティング
   assets/index-3fa1.js          ← wasm.js はここに混ぜ込まれる (URL は書き換え済み)
   assets/sim-9c2e.wasm          ← バイナリは別ファイルのまま
   ※ サーバーは Content-Type: application/wasm で返す必要がある
   ※ CSP を使うサイトなら script-src に 'wasm-unsafe-eval' が要る
        │ 来訪者がページを開く
        ▼
⑤ その Web の来訪者のブラウザ
   index-3fa1.js を実行
     → mount() はまず JS 版で即座に動き始める
     → fetch('/assets/sim-9c2e.wasm')
     → WebAssembly.instantiateStreaming (ダウンロードしながらコンパイル)
     → WASM のメモリ上に x / y / vx / vy を置く
     → 描画側はそのメモリを Float32Array として直接読む (コピーなし)
   失敗 (CSP 拒否・404・未対応) → console に原因を出し、JS 版のまま続ける
```

## 場所ごとの状態と壊れやすい所

| 場所 | `.wasm` の状態 | 誰が作る・動かす | 壊れやすい所 |
|---|---|---|---|
| ① 開発環境 | ビルドで生成 (git 管理外) | ライブラリ作者 (cargo / tsc) | ツールチェーンの用意。CI にも同じものが要る |
| ② npm | tgz の中のバイナリ。固定 | `npm publish` | `files` に入っていないと抜け落ちる |
| ③ 利用者の開発環境 | node_modules にあるだけ | 利用者の `pnpm add` | バンドラーが `new URL(…, import.meta.url)` を解決できるか (TODO: Next.js / webpack 5 / Vite / esbuild で実際に確かめる) |
| ④ 利用者の Web | ハッシュ付きの静的ファイル | 利用者のビルド | MIME type、CSP |
| ⑤ ブラウザ | ダウンロード → コンパイル → 実行 | 来訪者のブラウザ | 初期化が非同期。失敗したら JS 版で続ける |

## JS module での配布との違い

| | JS module | WASM を同梱 |
|---|---|---|
| パッケージの中身 | `lib/esm` / `lib/cjs` / 型定義 | + `.wasm` バイナリ |
| 読み込み | `import` した時点で使える | 取得 + コンパイルが**非同期** (大きい WASM は main thread で同期コンパイルできない) |
| API | 同期で返せる | `await` が要る。または JS 版で先に動かし、後から差し替える |
| ファイル位置の解決 | 不要 | `new URL('./x.wasm', import.meta.url)`。CJS では `import.meta.url` が使えない |
| base64 で JS に埋め込む | — | 位置の問題は消えるがサイズ約 1.33 倍。非同期は残る |
| CDN から 1 行 | そのまま動く | 同じ場所から配信されるので動く。リクエストは 1 回増える |
| CSP | 制約なし | `'wasm-unsafe-eval'` が要る。**埋め込み用ライブラリでは一番の弱点** |
| ビルドと CI | tsc だけ | Rust 等のツールチェーンが増える |
| デバッグ | DevTools でそのまま | 追いにくい。テストは JS 版と結果が一致するかの比較が中心 |

## 結論 (いまの方針)

- WASM は**使う人だけが読み込む別の入り口** (`particle-life-bg/wasm`) に分ける。本体は依存ゼロ・同期のまま。
  WASM を選ばない利用者には、③〜⑤の問題が一切及ばない。
- `mount()` に計算部分を差し替える口を 1 つ設け、描画とオプションは共通にする。
- 採否は、**計算だけの比較ベンチ (JS / WASM / WASM SIMD)** の数字で決める。

## 速さの見込み (TODO: 実測で置き換える)

- 素直な移植: JS 比 1〜1.5 倍程度 (V8 の JIT は型付き配列の単純なループを十分速く回すので差は小さい)
- SIMD (4 粒子ずつ): 2〜4 倍程度。ただし粒子をセル順に並べ替えた写しが要る (並べ替えないと 4 粒子の座標がメモリ上で離れていて、集めるコストで得が消える)
- マルチスレッド: 共有メモリにクロスオリジン分離 (COOP/COEP ヘッダー) が要るので、埋め込みライブラリでは前提にできない
- 別解: Worker + OffscreenCanvas は速さは同じだが、ページのスクロールや操作を詰まらせない

## 書く前に確かめること

- [ ] ベンチの実測値 (1500 / 3000 / 5000 粒子、ms/step、端末別)
- [ ] 主要バンドラーでの `new URL(…, import.meta.url)` の扱い (Next.js は設定が要るか)
- [ ] `WebAssembly.compile` の同期制限の正確なサイズと出典
- [ ] `'wasm-unsafe-eval'` の対応ブラウザと、古い `'unsafe-eval'` との関係
- [ ] .wasm の実サイズ (いま: 素直な移植 26KB / SIMD 29KB、wasm-opt 前)
