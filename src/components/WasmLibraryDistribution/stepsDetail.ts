// docs/drafts/wasm-library-distribution.md 「配布フロー」 と同期する
// 1 枚図のデータ: 列 = 環境 (①は build 前後で分割), 行 = ファイル, カード = 初登場セル

export type FileKind = 'text' | 'binary'

export type CardData = {
  type: 'card'
  name: string
  kind: FileKind
  raw: string
  holds: string
}

export type CellData = {
  type: 'cell'
  kind: FileKind
  label: string
  sub?: string
  raw?: string
}

export type ColDef = {
  title: string
  sub: string
  structure: string
  risk?: string
}

export type RowDef = {
  cells: (CardData | CellData | null)[]
}

export const DIAGRAM_COLS: ColDef[] = [
  {
    title: '① 開発環境',
    sub: 'build 前 (ソース)',
    structure: '人が読むテキストが正本',
    risk: 'ツールチェーンの用意\n(CI も同じ版)',
  },
  {
    title: '① 開発環境',
    sub: 'build 後 (生成物)',
    structure: 'バイナリは派生物\n(git 管理外・再生成可能)',
  },
  {
    title: '② registry',
    sub: 'npm publish',
    structure: 'immutable スナップショット。\n再コンパイルされない',
  },
  {
    title: '③ 利用者 dev',
    sub: 'pnpm add',
    structure: 'まだ実行されない。\nバンドラーの解析対象',
    risk: 'new URL を解決できるか\n(CJS では import.meta.url 不可)',
  },
  {
    title: '④ 公開 Web',
    sub: 'bundle + deploy',
    structure: '静的ファイル群。\nJS と wasm は別リクエスト (+1)',
    risk: "Content-Type: wasm 必須。\nCSP は 'wasm-unsafe-eval'",
  },
  {
    title: '⑤ browser',
    sub: 'fetch + compile',
    structure: 'ここで初めて実行状態。\n初期化は非同期',
    risk: '失敗 (CSP/404/MIME/未対応)\nは JS 版で吸収',
  },
]

export const DIAGRAM_ROWS: RowDef[] = [
  {
    // lib.rs — build で x.wasm へ変換するだけの行
    cells: [
      {
        type: 'card',
        name: 'wasm/src/lib.rs',
        kind: 'text',
        raw: '#[wasm_bindgen]\npub fn step(ptr: usize,\n  n: usize, dt: f32) {',
        holds: '計算ロジックの正本。\n配布管を流れる情報の源',
      },
      null,
      null,
      null,
      null,
      null,
    ],
  },
  {
    // loader.ts → wasm.js — ④ で minify されて index js へ混ぜ込み
    cells: [
      {
        type: 'card',
        name: 'src/loader.ts',
        kind: 'text',
        raw: "const res = await fetch(\n  new URL('./x.wasm',\n    import.meta.url))",
        holds: '.wasm の位置解決 + 初期化手順。\n配布後も wasm.js として残る',
      },
      {
        type: 'cell',
        kind: 'text',
        label: 'lib/esm/wasm.js',
        sub: 'テキストのままコピー',
      },
      { type: 'cell', kind: 'text', label: 'tgz 内 wasm.js' },
      { type: 'cell', kind: 'text', label: 'node_modules/…/wasm.js' },
      {
        type: 'cell',
        kind: 'text',
        label: 'minify 後 (index js へ混ぜ込み)',
        raw: 'const e=await fetch("/assets/\n  x-9c2e.wasm"),t=await\n  WebAssembly.instantiateStreaming(e)',
      },
      null,
    ],
  },
  {
    // index.ts → *.js
    cells: [
      {
        type: 'card',
        name: 'src/index.ts',
        kind: 'text',
        raw: 'export function createEngine(\n  opts: Options): Engine { … }',
        holds: 'JS 版実装と公開 API の形。\nフォールバック兼',
      },
      { type: 'cell', kind: 'text', label: 'lib/esm/index.js' },
      { type: 'cell', kind: 'text', label: 'tgz 内 index.js' },
      { type: 'cell', kind: 'text', label: 'node_modules/…/index.js' },
      {
        type: 'cell',
        kind: 'text',
        label: 'minify 後 (index js へ混ぜ込み)',
        raw: 'function createEngine(e){\n  return new Engine(e)}',
      },
      null,
    ],
  },
  {
    // x.wasm — ① build 後に初登場。⑤ で実行状態へ
    cells: [
      {
        type: 'cell',
        kind: 'binary',
        label: '—',
        sub: 'まだ無い',
      },
      {
        type: 'card',
        name: 'lib/esm/x.wasm',
        kind: 'binary',
        raw: '00 61 73 6d 01 00 00 00\n1a 85 80 80 00 …',
        holds: '機械語 (バイトコード)。\n人は読めないが実行に必要な全情報',
      },
      {
        type: 'cell',
        kind: 'binary',
        label: 'tgz 内エントリ',
        sub: '同一バイト列',
      },
      {
        type: 'cell',
        kind: 'binary',
        label: 'node_modules/x.wasm',
        sub: '展開コピー',
      },
      {
        type: 'cell',
        kind: 'binary',
        label: 'x-9c2e.wasm',
        sub: 'hash リネーム・中身同一',
      },
      {
        type: 'cell',
        kind: 'binary',
        label: '線形メモリへ展開',
        raw: '0000  00 00 80 3f\n      00 00 00 40 …',
      },
    ],
  },
  {
    // package.json → tgz
    cells: [
      {
        type: 'card',
        name: 'package.json',
        kind: 'text',
        raw: '"files": ["lib"],\n"exports": {\n  "./wasm": "…/wasm.js" }',
        holds: '配布ルール。\n何を同梱しどの入口を公開するか',
      },
      null,
      {
        type: 'card',
        name: 'my-lib-x.y.z.tgz',
        kind: 'binary',
        raw: '1f 8b 08 00 …\n(gzip ヘッダ)',
        holds: '「バージョン x.y.z =\nこの中身」の対応付け',
      },
      {
        type: 'cell',
        kind: 'binary',
        label: 'tar 展開 →',
        sub: 'node_modules/ へ',
      },
      null,
      null,
    ],
  },
]

// 接続線: 影響し合うセルを結ぶ。from/to = セル座標 (row, col) + アンカー辺
export type LinkDef = {
  from: { row: number; col: number; anchor: 'right' | 'bottom' }
  to: { row: number; col: number; anchor: 'left' | 'top' }
  label: string
}

export const DIAGRAM_LINKS: LinkDef[] = [
  {
    from: { row: 0, col: 0, anchor: 'bottom' },
    to: { row: 3, col: 1, anchor: 'top' },
    label: 'build (cargo + wasm-opt)',
  },
  {
    from: { row: 1, col: 0, anchor: 'right' },
    to: { row: 3, col: 1, anchor: 'left' },
    label: "new URL('./x.wasm') で位置参照",
  },
  {
    from: { row: 4, col: 0, anchor: 'right' },
    to: { row: 4, col: 2, anchor: 'left' },
    label: 'files: ["lib"] で同梱',
  },
  {
    from: { row: 4, col: 2, anchor: 'bottom' },
    to: { row: 4, col: 3, anchor: 'top' },
    label: 'tar 展開 (pnpm add)',
  },
  {
    from: { row: 1, col: 4, anchor: 'bottom' },
    to: { row: 3, col: 4, anchor: 'top' },
    label: 'URL 書き換え',
  },
  {
    from: { row: 3, col: 4, anchor: 'right' },
    to: { row: 3, col: 5, anchor: 'left' },
    label: 'fetch + instantiateStreaming',
  },
]
