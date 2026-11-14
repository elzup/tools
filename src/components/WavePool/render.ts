import type { Drive, Vec } from './drive'
import type { Pool, Source } from './sim'

export type ViewMode = 'height' | 'energy'

type RGB = [number, number, number]

// 発散配色の両端と中央。水面の 0 を暗い水色にして、山 (暖色) と谷 (寒色) を対称に見せる
const CREST: RGB = [255, 196, 110]
const TROUGH: RGB = [80, 165, 255]
const STILL: RGB = [16, 34, 56]
const OUTSIDE: RGB = [28, 32, 42]
// エネルギー表示の順序配色 (黒 → 紫 → 橙 → 黄)。magma 系の近似
const ENERGY_STOPS: RGB[] = [
  [8, 8, 20],
  [90, 30, 120],
  [220, 80, 70],
  [255, 220, 120],
]
// 表示スケールの減衰。直前の最大値をゆっくり忘れて、立ち上がり中も見やすくする
const PEAK_DECAY = 0.98
const MIN_PEAK = 1e-6

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const heightColor = (v: number): RGB =>
  v >= 0
    ? mix(STILL, CREST, Math.min(1, v))
    : mix(STILL, TROUGH, Math.min(1, -v))

const energyColor = (v: number): RGB => {
  // √ で圧縮しないと焦点だけが光り、周りのパターンが見えない
  const t = Math.min(1, Math.sqrt(Math.max(0, v))) * (ENERGY_STOPS.length - 1)
  const i = Math.min(ENERGY_STOPS.length - 2, Math.floor(t))
  return mix(ENERGY_STOPS[i], ENERGY_STOPS[i + 1], t - i)
}

const fieldPeak = (pool: Pool, view: ViewMode) => {
  const field = view === 'height' ? pool.cur : pool.energy
  let peak = 0
  for (let idx = 0; idx < field.length; idx++) {
    if (pool.mask[idx] === 0) continue
    const v = Math.abs(field[idx])
    if (v > peak) peak = v
  }
  return peak
}

/** 場を ImageData に塗る。次フレームで使う表示スケールを返す */
export const paintField = (
  pool: Pool,
  view: ViewMode,
  image: ImageData,
  lastPeak: number
): number => {
  const peak = Math.max(MIN_PEAK, fieldPeak(pool, view), lastPeak * PEAK_DECAY)
  const field = view === 'height' ? pool.cur : pool.energy
  const { data } = image

  for (let idx = 0; idx < field.length; idx++) {
    const color =
      pool.mask[idx] === 0
        ? OUTSIDE
        : view === 'height'
          ? heightColor(field[idx] / peak)
          : energyColor(field[idx] / peak)
    const o = idx * 4
    data[o] = color[0]
    data[o + 1] = color[1]
    data[o + 2] = color[2]
    data[o + 3] = 255
  }
  return peak
}

export const createImage = (size: number) => new ImageData(size, size)

const SOURCE_MIN_RADIUS = 1.5
const SOURCE_AMP_RADIUS = 3
const TARGET_RADIUS = 5

/** 造波機 (色 = 位相、大きさ = 振幅) とターゲット、プールの縁を重ねる */
export const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  pool: Pool,
  sources: Source[],
  drives: Drive[],
  targetCells: Vec[],
  scale: number
) => {
  ctx.lineWidth = 1.5
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(
    (pool.center.x + 0.5) * scale,
    (pool.center.y + 0.5) * scale,
    (pool.radius + 0.5) * scale,
    0,
    Math.PI * 2
  )
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  for (const t of targetCells) {
    ctx.beginPath()
    ctx.arc(
      (t.x + 0.5) * scale,
      (t.y + 0.5) * scale,
      TARGET_RADIUS,
      0,
      Math.PI * 2
    )
    ctx.stroke()
  }

  sources.forEach((src, j) => {
    const d = drives[j]
    const hue = ((d.phase / (2 * Math.PI)) * 360 + 360) % 360
    ctx.fillStyle = `hsl(${hue.toFixed(0)}, 85%, 60%)`
    ctx.beginPath()
    ctx.arc(
      (src.pos.x + 0.5) * scale,
      (src.pos.y + 0.5) * scale,
      SOURCE_MIN_RADIUS + SOURCE_AMP_RADIUS * d.amp,
      0,
      Math.PI * 2
    )
    ctx.fill()
  })
}
