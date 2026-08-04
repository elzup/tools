import {
  type ColorMode,
  type Rgb,
  UNASSIGNED_COLOR,
  blockRgbOf,
  hexToRgb,
  specialColorOf,
  specialOf,
} from './colors'
import { N, SIZE, TOTAL, blocks } from './mapData'
import type { MapLayout } from './positions'
import { type Wall, buildWalls } from './walls'

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
  blocks.map((block) => blockRgbOf(block, mode))

const paintPixels = (
  data: Uint8ClampedArray,
  positions: Positions,
  blockIndex: Int16Array,
  palette: Rgb[]
) => {
  for (let cp = 0; cp < TOTAL; cp++) {
    const special = specialOf(cp)
    const blockIdx = blockIndex[cp]
    const rgb: Rgb = special
      ? SPECIAL_RGB[special]
      : blockIdx < 0
        ? UNASSIGNED_RGB
        : palette[blockIdx]
    const offset = (positions.ys[cp] * N + positions.xs[cp]) * 4

    data[offset] = rgb[0]
    data[offset + 1] = rgb[1]
    data[offset + 2] = rgb[2]
    data[offset + 3] = 255
  }
}

/**
 * ヒルベルト曲線の壁。1 枚の絵の中では太さを揃え、
 * 細かいレベルでセルが白く潰れないようにセル幅から太さを決める。
 * 下地が多色なので、暗い縁取りの上に白を重ねてどの色の上でも視認できるようにする。
 */
const wallWidthAt = (level: number) =>
  Math.max(1.2, Math.min(4, SIZE / 2 ** level / 6))

const strokeWalls = (
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  width: number,
  color: string
) => {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  for (const wall of walls) {
    ctx.moveTo(wall.x1, wall.y1)
    ctx.lineTo(wall.x2, wall.y2)
  }
  ctx.stroke()
}

const drawWalls = (
  ctx: CanvasRenderingContext2D,
  wallLevel: number,
  layout: MapLayout
) => {
  // 壁はヒルベルト曲線の通り方で決まるので、行優先では意味を持たない
  if (layout !== 'hilbert') return
  const walls = buildWalls(wallLevel)

  const width = wallWidthAt(wallLevel)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  strokeWalls(ctx, walls, width * 1.8, 'rgba(17,17,17,0.85)')
  strokeWalls(ctx, walls, width, 'rgba(255,255,255,0.95)')
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

  paintPixels(imageData.data, positions, blockIndex, buildPalette(mode))
  bufferCtx.putImageData(imageData, 0, 0)

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.drawImage(buffer, 0, 0, SIZE, SIZE)
  drawWalls(ctx, wallLevel, layout)
}
