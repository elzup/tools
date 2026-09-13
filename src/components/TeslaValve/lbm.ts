import type { Geometry } from './geometry'

// D2Q9 格子ボルツマン法 (BGK 衝突 + Guo の体積力 + 壁はバウンスバック)。
// x は周期境界なので、一定の体積力で押し続けると「同じ流路をぐるぐる回る」定常流になる。
// 順方向と逆方向で力の符号だけを変えた 2 本を同条件で回し、流量の比を整流比 (diodicity) とする。
const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1]
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1]
const WEIGHT = [
  4 / 9,
  1 / 9,
  1 / 9,
  1 / 9,
  1 / 9,
  1 / 36,
  1 / 36,
  1 / 36,
  1 / 36,
]
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6]
const Q = 9

export type Drive = {
  viscosity: number // 動粘性係数 ν [格子単位]
  force: number // x 方向の体積力。符号が流れの向き
}

// 大きな Float32Array を毎ステップ作り直すと GC で描画が詰まるので、
// ここだけは例外的に破壊的更新で回す
export type Lattice = {
  geo: Geometry
  f: Float32Array // 分布関数 [dir * N + idx]
  fNext: Float32Array
  rho: Float32Array
  ux: Float32Array
  uy: Float32Array
  drive: Drive
  steps: number
}

export const omegaOf = (viscosity: number): number => 1 / (3 * viscosity + 0.5)

const equilibrium = (
  i: number,
  rho: number,
  ux: number,
  uy: number
): number => {
  const eu = EX[i] * ux + EY[i] * uy
  const usq = ux * ux + uy * uy

  return WEIGHT[i] * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * usq)
}

// 定常状態の目安 (半幅 h の平面ポアズイユ流の断面平均) で初期化しておくと、
// 静止から始めるより収束が数千ステップ早い
export const estimateMeanU = (
  geo: Geometry,
  { viscosity, force }: Drive
): number => {
  const h = geo.params.channelHalf

  return (force * h * h) / (3 * viscosity)
}

export const createLattice = (geo: Geometry, drive: Drive): Lattice => {
  const n = geo.nx * geo.ny
  const f = new Float32Array(n * Q)
  const u0 = estimateMeanU(geo, drive)

  for (let idx = 0; idx < n; idx++) {
    if (geo.solid[idx] === 1) continue
    for (let i = 0; i < Q; i++) f[i * n + idx] = equilibrium(i, 1, u0, 0)
  }

  return {
    geo,
    f,
    fNext: new Float32Array(n * Q),
    rho: new Float32Array(n).fill(1),
    ux: new Float32Array(n),
    uy: new Float32Array(n),
    drive,
    steps: 0,
  }
}

export const step = (l: Lattice) => {
  const { nx, ny, solid } = l.geo
  const n = nx * ny
  const { f, fNext, rho, ux, uy } = l
  const omega = omegaOf(l.drive.viscosity)
  const fx = l.drive.force
  const forceScale = 1 - omega / 2 // Guo の力項の係数

  // 衝突: 分布関数を局所平衡へ緩和し、体積力を加える
  for (let idx = 0; idx < n; idx++) {
    if (solid[idx] === 1) continue

    let density = 0
    let jx = 0
    let jy = 0

    for (let i = 0; i < Q; i++) {
      const fi = f[i * n + idx]

      density += fi
      jx += EX[i] * fi
      jy += EY[i] * fi
    }

    // Guo forcing では速度に力の半分を含める
    const vx = (jx + 0.5 * fx) / density
    const vy = jy / density

    rho[idx] = density
    ux[idx] = vx
    uy[idx] = vy

    for (let i = 0; i < Q; i++) {
      const eu = EX[i] * vx + EY[i] * vy
      const feq = equilibrium(i, density, vx, vy)
      const src =
        WEIGHT[i] * forceScale * fx * (3 * (EX[i] - vx) + 9 * eu * EX[i])
      const at = i * n + idx

      f[at] = f[at] - omega * (f[at] - feq) + src
    }
  }

  // 移流: 上流セルから引き込む。上流が壁なら自セルの反対向きを跳ね返す (no-slip)
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const idx = y * nx + x

      if (solid[idx] === 1) continue

      for (let i = 0; i < Q; i++) {
        const sy = y - EY[i]
        const sx = (x - EX[i] + nx) % nx
        const src = sy * nx + sx
        const wall = sy < 0 || sy >= ny || solid[src] === 1

        fNext[i * n + idx] = wall ? f[OPP[i] * n + idx] : f[i * n + src]
      }
    }
  }

  l.f = fNext
  l.fNext = f
  l.steps++
}

export const advance = (l: Lattice, count: number) => {
  for (let i = 0; i < count; i++) step(l)
}

// 断面あたりの平均質量流量。周期境界なので全セルの ρu_x を列数で割れば断面平均になる
export const flux = (l: Lattice): number => {
  const { nx, ny, solid } = l.geo
  let sum = 0

  for (let idx = 0; idx < nx * ny; idx++) {
    if (solid[idx] === 1) continue
    sum += l.rho[idx] * l.ux[idx]
  }

  return sum / nx
}

export const maxSpeed = (l: Lattice): number => {
  const { nx, ny, solid } = l.geo
  let max = 0

  for (let idx = 0; idx < nx * ny; idx++) {
    if (solid[idx] === 1) continue
    max = Math.max(max, Math.hypot(l.ux[idx], l.uy[idx]))
  }

  return max
}

export const isBroken = (l: Lattice): boolean =>
  !Number.isFinite(flux(l)) || maxSpeed(l) > 0.5

// 渦度 ∂v/∂x - ∂u/∂y。中心差分。壁際は片側が壁なので 0 のまま置く
export const vorticity = (l: Lattice, out: Float32Array): Float32Array => {
  const { nx, ny, solid } = l.geo

  out.fill(0)
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 0; x < nx; x++) {
      const idx = y * nx + x

      if (solid[idx] === 1) continue

      const left = y * nx + ((x - 1 + nx) % nx)
      const right = y * nx + ((x + 1) % nx)
      const up = idx - nx
      const down = idx + nx

      if (solid[left] === 1 || solid[right] === 1) continue
      if (solid[up] === 1 || solid[down] === 1) continue

      out[idx] = (l.uy[right] - l.uy[left]) / 2 - (l.ux[down] - l.ux[up]) / 2
    }
  }

  return out
}

export const reynolds = (l: Lattice, meanU: number): number =>
  (Math.abs(meanU) * l.geo.params.channelHalf * 2) / l.drive.viscosity
