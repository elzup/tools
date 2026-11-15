import type { Drive, Vec } from './drive'

// 円形プールの水面を 2D 線形波動方程式 η_tt = c²∇²η − γ η_t + F で解く。
// 浅水の線形波 (振幅 ≪ 水深 ≪ 波長) を想定し、分散は無視している。
// 単位は格子単位 (dx = 1, c = 1)

export type Wall = 'fixed' | 'free' | 'absorb'

export type Pool = {
  size: number
  center: Vec
  radius: number
  wall: Wall
  mask: Uint8Array
  damping: Float32Array
  prev: Float32Array
  cur: Float32Array
  next: Float32Array
  energy: Float32Array
  time: number
}

export type Source = { index: number; pos: Vec }

// 2D の陽的差分は c·dt/dx ≤ 1/√2 ≈ 0.707 で安定 (CFL 条件)。
// 0.5 にして余裕を取り、減衰項や強制項で境界ぎりぎりにならないようにする
export const DT = 0.5
// 時間平均エネルギーの追従係数。1 周期の数倍の時間で均すと定常パターンだけが残る
const ENERGY_TIME_CONSTANT = 200
const ENERGY_ALPHA = DT / ENERGY_TIME_CONSTANT
// 吸収壁のスポンジ層。波長より厚くないと反射が残るので、標準の波長 (~16 セル) より広めに取る
const SPONGE_WIDTH = 18
const SPONGE_STRENGTH = 0.25
// 造波機を壁から少し内側に置く。壁セルそのものに置くと境界条件と打ち消し合う
export const SOURCE_INSET = 2
// 点波源の強制振幅。表示は自動スケールなので値そのものに物理的な意味はない
const SOURCE_GAIN = 1

/** 格子 size のプール半径 (セル)。縁の 1 セルは壁の境界条件に使う */
export const poolRadiusOf = (size: number) => size / 2 - 1

export const createPool = (
  size: number,
  wall: Wall,
  baseDamping: number
): Pool => {
  const center = { x: (size - 1) / 2, y: (size - 1) / 2 }
  const radius = poolRadiusOf(size)
  const cells = size * size
  const mask = new Uint8Array(cells)
  const damping = new Float32Array(cells)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x - center.x, y - center.y)
      if (r > radius) continue
      const idx = y * size + x
      mask[idx] = 1
      damping[idx] = baseDamping + spongeAt(radius - r, wall)
    }
  }

  return {
    size,
    center,
    radius,
    wall,
    mask,
    damping,
    prev: new Float32Array(cells),
    cur: new Float32Array(cells),
    next: new Float32Array(cells),
    energy: new Float32Array(cells),
    time: 0,
  }
}

const spongeAt = (fromWall: number, wall: Wall) => {
  if (wall !== 'absorb' || fromWall >= SPONGE_WIDTH) return 0
  // 2 乗で立ち上げる。急に減衰を入れるとその段差自体が波を反射する
  const t = 1 - fromWall / SPONGE_WIDTH
  return SPONGE_STRENGTH * t * t
}

/** 円周上に count 個の造波機を置き、それぞれの格子セルを返す */
export const placeSources = (pool: Pool, count: number): Source[] => {
  const r = pool.radius - SOURCE_INSET
  return Array.from({ length: count }, (_, j) => {
    const theta = (2 * Math.PI * j) / count
    const pos = {
      x: pool.center.x + r * Math.cos(theta),
      y: pool.center.y + r * Math.sin(theta),
    }
    return { index: Math.round(pos.y) * pool.size + Math.round(pos.x), pos }
  })
}

const neighbor = (pool: Pool, j: number, self: number) => {
  if (pool.mask[j] === 1) return pool.cur[j]
  // 固定端は壁で η = 0 (位相反転して反射)、自由端と吸収は ∂η/∂n = 0 (同位相で反射)
  return pool.wall === 'fixed' ? 0 : self
}

const forcingField = (
  pool: Pool,
  sources: Source[],
  drives: Drive[],
  omega: number
) => {
  const forcing = new Map<number, number>()
  sources.forEach((src, j) => {
    const d = drives[j]
    const f = SOURCE_GAIN * d.amp * Math.cos(omega * pool.time + d.phase)
    forcing.set(src.index, (forcing.get(src.index) ?? 0) + f)
  })
  return forcing
}

const stepOnce = (
  pool: Pool,
  sources: Source[],
  drives: Drive[],
  omega: number
) => {
  const { size, mask, damping, prev, cur, next, energy } = pool
  const forcing = forcingField(pool, sources, drives, omega)
  const dt2 = DT * DT

  for (let idx = 0; idx < size * size; idx++) {
    if (mask[idx] === 0) continue
    const c = cur[idx]
    const lap =
      neighbor(pool, idx - 1, c) +
      neighbor(pool, idx + 1, c) +
      neighbor(pool, idx - size, c) +
      neighbor(pool, idx + size, c) -
      4 * c
    const half = (damping[idx] * DT) / 2
    const f = forcing.get(idx) ?? 0
    const value =
      (2 * c - (1 - half) * prev[idx] + dt2 * (lap + f)) / (1 + half)
    next[idx] = value
    energy[idx] += ENERGY_ALPHA * (value * value - energy[idx])
  }

  pool.prev = cur
  pool.cur = next
  pool.next = prev
  pool.time += DT
}

export const advance = (
  pool: Pool,
  sources: Source[],
  drives: Drive[],
  omega: number,
  steps: number
) => {
  for (let i = 0; i < steps; i++) stepOnce(pool, sources, drives, omega)
}

/** 波長 (セル) → 角周波数。c = 1 なので ω = 2π / λ */
export const omegaOf = (wavelength: number) => (2 * Math.PI) / wavelength

/** プール半径 = 1 の座標を格子座標へ */
export const toCell = (pool: Pool, p: Vec): Vec => ({
  x: pool.center.x + p.x * pool.radius,
  y: pool.center.y + p.y * pool.radius,
})

/** 格子座標をプール半径 = 1 の座標へ */
export const toUnit = (pool: Pool, p: Vec): Vec => ({
  x: (p.x - pool.center.x) / pool.radius,
  y: (p.y - pool.center.y) / pool.radius,
})

const meanEnergyAround = (pool: Pool, p: Vec, reach: number) => {
  let sum = 0
  let count = 0
  const cx = Math.round(p.x)
  const cy = Math.round(p.y)
  for (let y = cy - reach; y <= cy + reach; y++) {
    for (let x = cx - reach; x <= cx + reach; x++) {
      const idx = y * pool.size + x
      if (x < 0 || y < 0 || x >= pool.size || y >= pool.size) continue
      if (pool.mask[idx] === 0) continue
      sum += pool.energy[idx]
      count++
    }
  }
  return count === 0 ? 0 : sum / count
}

/**
 * ターゲット周辺 (半径 reach セル) の時間平均エネルギーが、プール全体平均の何倍か。
 * 1 を大きく超えるほど「狙った場所に波が集まっている」
 */
export const focusRatio = (pool: Pool, targetCells: Vec[], reach: number) => {
  let total = 0
  let count = 0
  for (let idx = 0; idx < pool.size * pool.size; idx++) {
    if (pool.mask[idx] === 0) continue
    total += pool.energy[idx]
    count++
  }
  const mean = total / count
  if (mean === 0 || targetCells.length === 0) return 0
  const atTargets =
    targetCells.reduce((acc, p) => acc + meanEnergyAround(pool, p, reach), 0) /
    targetCells.length
  return atTargets / mean
}

export const isBroken = (pool: Pool) => {
  const probe = pool.cur[Math.floor((pool.size * pool.size) / 2)]
  return !Number.isFinite(probe)
}
