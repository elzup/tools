import {
  Box,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
import {
  DIAGRAM_COLS,
  DIAGRAM_LINKS,
  DIAGRAM_ROWS,
  type CardData,
  type CellData,
} from './stepsDetail'

const DIFF_ROWS: string[][] = [
  ['パッケージの中身', 'lib/esm / lib/cjs / 型定義', '+ .wasm バイナリ'],
  ['読み込み', 'import した時点で使える', '取得 + コンパイルが非同期'],
  [
    'API',
    '同期で返せる',
    'await が要る。または JS 版で先に動かし、後から差し替える',
  ],
  [
    'ファイル位置の解決',
    '不要',
    "new URL('./x.wasm', import.meta.url)。CJS では import.meta.url が使えない",
  ],
  [
    'base64 で JS に埋め込む',
    '—',
    '位置の問題は消えるがサイズ約 1.33 倍。非同期は残る',
  ],
  [
    'CDN から 1 行',
    'そのまま動く',
    '同じ場所から配信されるので動く。リクエストは 1 回増える',
  ],
  ['CSP', '制約なし', "'wasm-unsafe-eval' が要る"],
  ['ビルドと CI', 'tsc だけ', 'Rust 等のツールチェーンが増える'],
  [
    'デバッグ',
    'DevTools でそのまま',
    '追いにくい。テストは JS 版と結果が一致するかの比較が中心',
  ],
]

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Box component="section" sx={{ mb: 4 }}>
    <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
)

// site-chrome (brown/gold) ベースで light/dark 両対応の図用色
const useDiagramColors = () => {
  const isDark = useTheme().palette.mode === 'dark'
  return {
    text: isDark ? '#efe7e2' : '#2d2520',
    muted: isDark ? '#a89b91' : '#7a6d64',
    brown: isDark ? '#d7ccc8' : '#795548',
    gold: isDark ? '#e8bc4e' : '#d4a017',
    goldSoft: isDark ? '#4a3b14' : '#f5e6c4',
    band: isDark ? 'rgba(215,204,200,0.10)' : 'rgba(121,85,72,0.08)',
    card: isDark ? '#241e1a' : '#ffffff',
  }
}

// ---- 1 枚図のレイアウト定数 ----
const L = {
  x0: 16,
  colW: 210,
  gap: 22,
  rowY: [84, 256, 428, 600, 772],
  w: 1400,
  h: 1040,
}
const colX = (i: number) => L.x0 + i * (L.colW + L.gap)

const measure = (c: CardData | CellData | null): number => {
  if (!c) return 0
  if (c.type === 'card') {
    const rawH = c.raw.split('\n').length * 11 + 8
    return 12 + 16 + 4 + rawH + 6 + c.holds.split('\n').length * 11 + 8
  }
  const rawH = c.raw ? c.raw.split('\n').length * 11 + 6 : 0
  return 10 + 12 + (c.sub ? 11 : 0) + rawH + 8
}

const Card = ({ x, y, card }: { x: number; y: number; card: CardData }) => {
  const c = useDiagramColors()
  const rawLines = card.raw.split('\n')
  const holdsLines = card.holds.split('\n')
  const rawH = rawLines.length * 11 + 8
  const bin = card.kind === 'binary'
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={L.colW}
        height={measure(card)}
        rx={8}
        fill={c.card}
        stroke={bin ? c.gold : c.brown}
        strokeWidth={1.4}
      />
      <text
        x={x + 10}
        y={y + 19}
        fontSize={11}
        fontWeight={700}
        fontFamily="Menlo, monospace"
        fill={c.text}
      >
        {card.name}
      </text>
      <rect
        x={x + L.colW - 46}
        y={y + 6}
        width={38}
        height={14}
        rx={4}
        fill={bin ? c.goldSoft : c.band}
        stroke={bin ? c.gold : c.brown}
      />
      <text
        x={x + L.colW - 27}
        y={y + 16}
        textAnchor="middle"
        fontSize={8.5}
        fontWeight={700}
        fill={bin ? c.gold : c.brown}
      >
        {bin ? 'BIN' : 'TXT'}
      </text>
      <rect
        x={x + 8}
        y={y + 30}
        width={L.colW - 16}
        height={rawH}
        rx={4}
        fill={c.band}
      />
      {rawLines.map((ln, i) => (
        <text
          key={i}
          x={x + 14}
          y={y + 42 + i * 11}
          fontSize={9}
          fontFamily="Menlo, monospace"
          fill={c.muted}
        >
          {ln}
        </text>
      ))}
      {holdsLines.map((ln, i) => (
        <text
          key={i}
          x={x + 10}
          y={y + 36 + rawH + 11 + i * 11}
          fontSize={9.5}
          fill={c.text}
        >
          {ln}
        </text>
      ))}
    </g>
  )
}

const Cell = ({ x, y, cell }: { x: number; y: number; cell: CellData }) => {
  const c = useDiagramColors()
  const bin = cell.kind === 'binary'
  const rawLines = cell.raw?.split('\n') ?? []
  const h = measure(cell)
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={L.colW}
        height={h}
        rx={6}
        fill={bin ? c.goldSoft : c.card}
        fillOpacity={bin ? 0.55 : 1}
        stroke={bin ? c.gold : c.brown}
        strokeOpacity={cell.label === '—' ? 0.5 : 0.9}
        strokeDasharray={cell.label === '—' ? '4 3' : undefined}
      />
      <text
        x={x + 10}
        y={y + 18}
        fontSize={10}
        fontWeight={700}
        fontFamily="Menlo, monospace"
        fill={c.text}
      >
        {cell.label}
      </text>
      {cell.sub && (
        <text x={x + 10} y={y + 30} fontSize={8.5} fill={c.muted}>
          {cell.sub}
        </text>
      )}
      {rawLines.map((ln, i) => (
        <text
          key={i}
          x={x + 10}
          y={y + (cell.sub ? 42 : 32) + i * 11}
          fontSize={9}
          fontFamily="Menlo, monospace"
          fill={c.muted}
        >
          {ln}
        </text>
      ))}
    </g>
  )
}

type Pt = [number, number]

const curve = (p1: Pt, p2: Pt, mode: 'hh' | 'hv' | 'vh' | 'vv') => {
  const d = 56
  const c1: Pt = mode[0] === 'h' ? [p1[0] + d, p1[1]] : [p1[0], p1[1] + d]
  const c2: Pt = mode[1] === 'h' ? [p2[0] - d, p2[1]] : [p2[0], p2[1] - d]
  return `M${p1[0]},${p1[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
}

const DistributionDiagram = () => {
  const c = useDiagramColors()
  const heights = DIAGRAM_ROWS.map((r) => r.cells.map(measure))
  const anchor = (
    row: number,
    col: number,
    side: 'right' | 'bottom' | 'left' | 'top'
  ): Pt => {
    const x = colX(col)
    const y = L.rowY[row]
    const h = heights[row][col]
    if (side === 'right') return [x + L.colW, y + h / 2]
    if (side === 'left') return [x, y + h / 2]
    if (side === 'bottom') return [x + L.colW / 2, y + h]
    return [x + L.colW / 2, y]
  }

  const zones = [
    { cols: [0, 1], label: '作者' },
    { cols: [2, 2], label: 'npm' },
    { cols: [3, 4], label: '利用者' },
    { cols: [5, 5], label: '来訪者' },
  ]

  return (
    <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
      <Box
        component="svg"
        viewBox={`0 0 ${L.w} ${L.h}`}
        role="img"
        aria-label="WASM ファイルの配布フロー。列は ① build 前・① build 後・② registry・③ 利用者 dev・④ 公開 Web・⑤ browser、行は lib.rs・loader.ts・index.ts・x.wasm・package.json。初登場のセルにカード、minify で変形するセルも中身を表示し、影響し合うセルを接続線で結んでいる"
        sx={{ width: '100%', minWidth: 1120, height: 'auto', display: 'block' }}
      >
        {/* 責任ゾーンの括り */}
        {zones.map((z) => {
          const x1 = colX(z.cols[0]) + 6
          const x2 = colX(z.cols[1]) + L.colW - 6
          const mid = (x1 + x2) / 2
          return (
            <g key={z.label}>
              <line
                x1={x1}
                y1={14}
                x2={x2}
                y2={14}
                stroke={c.brown}
                strokeWidth={1}
              />
              <line
                x1={x1}
                y1={14}
                x2={x1}
                y2={20}
                stroke={c.brown}
                strokeWidth={1}
              />
              <line
                x1={x2}
                y1={14}
                x2={x2}
                y2={20}
                stroke={c.brown}
                strokeWidth={1}
              />
              <text
                x={mid}
                y={10}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={c.brown}
              >
                {z.label}
              </text>
            </g>
          )
        })}

        {/* 列ヘッダ (境界の動作) */}
        {DIAGRAM_COLS.map((col, i) => (
          <g key={i}>
            <text
              x={colX(i)}
              y={40}
              fontSize={11}
              fontWeight={700}
              fill={c.text}
            >
              {col.sub}
            </text>
            {i < DIAGRAM_COLS.length - 1 && (
              <g>
                <line
                  x1={colX(i) + L.colW + 4}
                  y1={70}
                  x2={colX(i + 1) - 6}
                  y2={70}
                  stroke={c.muted}
                  strokeWidth={1.2}
                  markerEnd="url(#wasm-flow-arrow)"
                />
              </g>
            )}
          </g>
        ))}
        <defs>
          <marker
            id="wasm-flow-arrow"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={c.muted} />
          </marker>
        </defs>

        {/* 接続線はカードの下に通す (交差は「後ろを通過」として見せる) */}
        {DIAGRAM_LINKS.map((link) => {
          const p1 = anchor(link.from.row, link.from.col, link.from.anchor)
          const p2 = anchor(link.to.row, link.to.col, link.to.anchor)
          const mode = `${link.from.anchor === 'right' ? 'h' : 'v'}${
            link.to.anchor === 'left' ? 'h' : 'v'
          }` as const
          return (
            <path
              key={`line-${link.label}`}
              d={curve(p1, p2, mode)}
              stroke={c.gold}
              strokeWidth={1.3}
              fill="none"
              strokeDasharray="5 3"
            />
          )
        })}

        {/* セル */}
        {DIAGRAM_ROWS.map((row, r) =>
          row.cells.map((cell, col) => {
            if (!cell) return null
            const x = colX(col)
            const y = L.rowY[r]
            return cell.type === 'card' ? (
              <Card key={`${r}-${col}`} x={x} y={y} card={cell} />
            ) : (
              <Cell key={`${r}-${col}`} x={x} y={y} cell={cell} />
            )
          })
        )}

        {/* 接続線のラベルと端点 */}
        {DIAGRAM_LINKS.map((link) => {
          const p1 = anchor(link.from.row, link.from.col, link.from.anchor)
          const p2 = anchor(link.to.row, link.to.col, link.to.anchor)
          const mx = (p1[0] + p2[0]) / 2
          const my = (p1[1] + p2[1]) / 2
          return (
            <g key={`lbl-${link.label}`}>
              <circle cx={p1[0]} cy={p1[1]} r={2.5} fill={c.gold} />
              <circle cx={p2[0]} cy={p2[1]} r={2.5} fill={c.gold} />
              <text
                x={mx}
                y={my - 5}
                textAnchor="middle"
                fontSize={9}
                fill={c.gold}
                stroke={c.card}
                strokeWidth={3}
                paintOrder="stroke"
              >
                {link.label}
              </text>
            </g>
          )
        })}

        {/* 列ごとの情報構造 / 壊れやすい所 */}
        {DIAGRAM_COLS.map((col, i) => {
          const x = colX(i)
          const ys = 946
          return (
            <g key={`note-${i}`}>
              <text x={x} y={ys} fontSize={9.5} fontWeight={700} fill={c.brown}>
                情報構造
              </text>
              {col.structure.split('\n').map((ln, j) => (
                <text
                  key={j}
                  x={x}
                  y={ys + 13 + j * 12}
                  fontSize={9}
                  fill={c.muted}
                >
                  {ln}
                </text>
              ))}
              {col.risk && (
                <g>
                  <text
                    x={x}
                    y={ys + 13 + col.structure.split('\n').length * 12 + 6}
                    fontSize={9.5}
                    fontWeight={700}
                    fill={c.gold}
                  >
                    壊れやすい所
                  </text>
                  {col.risk.split('\n').map((ln, j) => (
                    <text
                      key={j}
                      x={x}
                      y={
                        ys +
                        13 +
                        col.structure.split('\n').length * 12 +
                        19 +
                        j * 12
                      }
                      fontSize={9}
                      fill={c.muted}
                    >
                      {ln}
                    </text>
                  ))}
                </g>
              )}
            </g>
          )
        })}
      </Box>
    </Paper>
  )
}

const DocTable = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          {head.map((cell) => (
            <TableCell key={cell}>
              <Typography variant="body2" fontWeight={700}>
                {cell}
              </Typography>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell, i) => (
              <TableCell key={cell} sx={{ whiteSpace: 'normal' }}>
                <Typography variant="body2" fontWeight={i === 0 ? 700 : 400}>
                  {cell}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

const WasmLibraryDistribution = () => {
  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 1 }}>
        JS だけのライブラリなら「npm
        に置けば、利用者のバンドラーが混ぜてくれる」で済む。 WASM を同梱すると
        `.wasm` というバイナリファイルが関わるため、関わる場所が 5
        つに分かれ、それぞれで壊れ方が違う。
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ライブラリ名・ファイル名の my-lib / x.wasm
        は抽象的な代表例。カードが置かれたセルがそのファイルの初登場。
      </Typography>

      <Section title="配布フロー図">
        <DistributionDiagram />
      </Section>

      <Section title="JS だけのライブラリとの違い">
        <DocTable head={['項目', 'JS だけ', 'WASM を同梱']} rows={DIFF_ROWS} />
        <Typography variant="body2" color="text.secondary">
          参考:{' '}
          <Link
            href="https://developer.mozilla.org/docs/WebAssembly"
            target="_blank"
            rel="noopener noreferrer"
          >
            MDN WebAssembly
          </Link>
        </Typography>
      </Section>
    </Box>
  )
}

export default WasmLibraryDistribution
