import type { Geometry } from './geometry'
import type { Lattice } from './lbm'
import { vorticity } from './lbm'

export type ViewMode = 'speed' | 'vorticity' | 'pressure'

type Rgb = readonly [number, number, number]

const WALL: Rgb = [28, 32, 42]

// 速さ: 暗い青 → 水色 → 黄 → 赤。渦度/圧力: 青 ↔ 白 ↔ 赤 の発散配色
const SPEED_RAMP: Rgb[] = [
  [10, 14, 36],
  [26, 62, 132],
  [24, 152, 182],
  [96, 212, 132],
  [250, 222, 92],
  [246, 92, 58],
]
const DIVERGING_RAMP: Rgb[] = [
  [40, 88, 200],
  [122, 168, 232],
  [244, 244, 246],
  [238, 150, 118],
  [198, 42, 42],
]

const sampleRamp = (ramp: Rgb[], t: number): Rgb => {
  const clamped = Math.min(1, Math.max(0, t)) * (ramp.length - 1)
  const i = Math.min(ramp.length - 2, Math.floor(clamped))
  const f = clamped - i
  const a = ramp[i]
  const b = ramp[i + 1]

  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ]
}

export const createImage = (geo: Geometry): ImageData =>
  new ImageData(geo.nx, geo.ny)

export const paintField = (
  l: Lattice,
  mode: ViewMode,
  img: ImageData,
  scratch: Float32Array
) => {
  const { nx, ny, solid } = l.geo
  const data = img.data
  const field =
    mode === 'vorticity'
      ? vorticity(l, scratch)
      : mode === 'pressure'
        ? l.rho
        : null
  // 表示レンジは固定にする。毎フレーム最大値で正規化すると色が呼吸して比較できない
  const speedMax = 0.12
  const vortMax = 0.06
  const rhoMax = 0.004

  for (let idx = 0; idx < nx * ny; idx++) {
    const at = idx * 4
    const color =
      solid[idx] === 1
        ? WALL
        : field === null
          ? sampleRamp(SPEED_RAMP, Math.hypot(l.ux[idx], l.uy[idx]) / speedMax)
          : sampleRamp(
              DIVERGING_RAMP,
              mode === 'pressure'
                ? 0.5 + (field[idx] - 1) / (2 * rhoMax)
                : 0.5 + field[idx] / (2 * vortMax)
            )

    data[at] = color[0]
    data[at + 1] = color[1]
    data[at + 2] = color[2]
    data[at + 3] = 255
  }
}

export type Tracers = {
  xs: Float32Array
  ys: Float32Array
  fluidCells: Int32Array
}

const randomCell = (t: Tracers, geo: Geometry, i: number) => {
  const cell = t.fluidCells[(Math.random() * t.fluidCells.length) | 0]

  t.xs[i] = (cell % geo.nx) + Math.random()
  t.ys[i] = ((cell / geo.nx) | 0) + Math.random()
}

export const createTracers = (geo: Geometry, count: number): Tracers => {
  const fluid: number[] = []

  for (let idx = 0; idx < geo.nx * geo.ny; idx++) {
    if (geo.solid[idx] === 0) fluid.push(idx)
  }

  const tracers: Tracers = {
    xs: new Float32Array(count),
    ys: new Float32Array(count),
    fluidCells: Int32Array.from(fluid),
  }

  for (let i = 0; i < count; i++) randomCell(tracers, geo, i)

  return tracers
}

// 粒子を速度場で流す。壁際で止まった粒子は捨てて撒き直す
// (止まった粒子が壁沿いに溜まると、そこだけ点が濃くなって流れの絵が読めなくなる)
export const advectTracers = (t: Tracers, l: Lattice, dt: number) => {
  const { nx, ny, solid } = l.geo

  for (let i = 0; i < t.xs.length; i++) {
    const cx = Math.min(nx - 1, Math.max(0, Math.floor(t.xs[i])))
    const cy = Math.min(ny - 1, Math.max(0, Math.floor(t.ys[i])))
    const idx = cy * nx + cx

    if (solid[idx] === 1) {
      randomCell(t, l.geo, i)
      continue
    }

    const speed = Math.hypot(l.ux[idx], l.uy[idx])

    if (speed < 0.002 && Math.random() < 0.05) {
      randomCell(t, l.geo, i)
      continue
    }

    const x = t.xs[i] + l.ux[idx] * dt
    const y = t.ys[i] + l.uy[idx] * dt

    t.xs[i] = ((x % nx) + nx) % nx // x は周期境界なので端で巻き戻す
    t.ys[i] = y
  }
}

export const drawTracers = (
  ctx: CanvasRenderingContext2D,
  t: Tracers,
  scale: number
) => {
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  for (let i = 0; i < t.xs.length; i++) {
    ctx.fillRect(t.xs[i] * scale - 1, t.ys[i] * scale - 1, 2.4, 2.4)
  }
}
