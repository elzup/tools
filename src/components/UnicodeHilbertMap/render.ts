import {
  type ColorMode,
  type Rgb,
  UNASSIGNED_COLOR,
  blockRgbOf,
  hexToRgb,
  hslToRgb,
  specialColorOf,
  specialOf,
} from './colors'
import { N, SIZE, TOTAL, blocks } from './mapData'
import type { MapLayout } from './positions'
import { buildWalls } from './walls'

export type Positions = { xs: Uint8Array; ys: Uint8Array; cpAt: Int32Array }

const SPECIAL_RGB = {
  control: hexToRgb(specialColorOf('control')),
  surrogate: hexToRgb(specialColorOf('surrogate')),
  pua: hexToRgb(specialColorOf('pua')),
  specials: hexToRgb(specialColorOf('specials')),
} as const

const UNASSIGNED_RGB = hexToRgb(UNASSIGNED_COLOR)

/** ブロックごとの代表色を先に配列化しておき、65,536 回のループを軽くする */
const buildPalette = (mode: ColorMode): Rgb[] =>
  blocks.map((block) => blockRgbOf(block, mode, 0))

const paintPixels = (
  data: Uint8ClampedArray,
  positions: Positions,
  blockIndex: Int16Array,
  mode: ColorMode,
  palette: Rgb[]
) => {
  for (let cp = 0; cp < TOTAL; cp++) {
    const special = specialOf(cp)
    const blockIdx = blockIndex[cp]
    const rgb: Rgb = special
      ? SPECIAL_RGB[special]
      : blockIdx < 0
        ? UNASSIGNED_RGB
        : mode === 'spectrum'
          ? hslToRgb((cp / TOTAL) * 360)
          : palette[blockIdx]
    const offset = (positions.ys[cp] * N + positions.xs[cp]) * 4

    data[offset] = rgb[0]
    data[offset + 1] = rgb[1]
    data[offset + 2] = rgb[2]
    data[offset + 3] = 255
  }
}

/** ヒルベルト曲線の再帰レベルに対応する補助線 (壁) */
// 上位レベルの壁ほど太く濃く描き、再帰構造を読み取れるようにする
const WALL_STYLES = [
  { width: 3, alpha: 0.85 },
  { width: 2, alpha: 0.7 },
  { width: 1.4, alpha: 0.55 },
  { width: 1, alpha: 0.45 },
]

const drawWalls = (
  ctx: CanvasRenderingContext2D,
  wallLevel: number,
  layout: MapLayout
) => {
  // 壁はヒルベルト曲線の通り方で決まるので、行優先では意味を持たない
  if (layout !== 'hilbert') return
  const walls = buildWalls(wallLevel)

  ctx.lineCap = 'round'
  for (let depth = 1; depth <= wallLevel; depth++) {
    const style = WALL_STYLES[Math.min(depth, WALL_STYLES.length) - 1]

    ctx.strokeStyle = `rgba(255,255,255,${style.alpha})`
    ctx.lineWidth = style.width
    ctx.beginPath()
    for (const wall of walls.filter((w) => w.depth === depth)) {
      ctx.moveTo(wall.x1, wall.y1)
      ctx.lineTo(wall.x2, wall.y2)
    }
    ctx.stroke()
  }
}

export const renderMap = (
  ctx: CanvasRenderingContext2D,
  positions: Positions,
  blockIndex: Int16Array,
  mode: ColorMode,
  wallLevel: number,
  layout: MapLayout
) => {
  const buffer = document.createElement('canvas')

  buffer.width = N
  buffer.height = N
  const bufferCtx = buffer.getContext('2d')

  if (!bufferCtx) return
  const imageData = bufferCtx.createImageData(N, N)

  paintPixels(imageData.data, positions, blockIndex, mode, buildPalette(mode))
  bufferCtx.putImageData(imageData, 0, 0)

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.drawImage(buffer, 0, 0, SIZE, SIZE)
  drawWalls(ctx, wallLevel, layout)
}
