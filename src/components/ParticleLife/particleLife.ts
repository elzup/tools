// Particle Life: 種類ごとの非対称な引力/斥力行列だけで、細胞・鎖・捕食のような構造が自己組織化する。
// 空間は [0,1)² のトーラス (端が反対側につながる)。距離は rMax で正規化して扱う。
//
// 毎フレーム数千粒子 × 近傍を回すため、状態は Float32Array を直接書き換える
// (オブジェクト配列を spread で作り直すと GC が 60fps を維持できない)。

export type Matrix = number[][]

export type Params = {
  rMax: number // 相互作用が届く距離 (空間幅 1 に対する比)
  frictionHalfLife: number // 速度が半分になるまでの秒数
  forceFactor: number // 力の倍率
}

export type World = {
  count: number
  types: Uint8Array
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  near: Uint16Array // 直前の step で rMax 内にいた粒子数 (描画で密集度に使う)
}

// これより近いと種類に関係なく反発する (粒子が 1 点に潰れないための最小距離、rMax 比)
export const BETA = 0.3

/**
 * 正規化距離 r (0〜1) と引力係数 a (-1〜1) から力の大きさを返す。
 * r < BETA は一律の反発、BETA〜1 は a を頂点とする三角形の山。
 */
export const force = (r: number, a: number): number => {
  if (r < BETA) return r / BETA - 1
  if (r < 1) return a * (1 - Math.abs(2 * r - 1 - BETA) / (1 - BETA))
  return 0
}

/** トーラス上の最短差分 (-0.5〜0.5) */
export const wrapDelta = (d: number): number => {
  if (d > 0.5) return d - 1
  if (d < -0.5) return d + 1
  return d
}

const wrap01 = (v: number): number => v - Math.floor(v)

export type Rng = () => number

export const randomMatrix = (n: number, rng: Rng = Math.random): Matrix =>
  Array.from({ length: n }, () =>
    Array.from({ length: n }, () => rng() * 2 - 1)
  )

/** a[i][j] = a[j][i]。作用反作用がそろうので、固まりが静かに落ち着きやすい */
export const symmetricMatrix = (n: number, rng: Rng = Math.random): Matrix => {
  const base = randomMatrix(n, rng)

  return base.map((row, i) => row.map((v, j) => (j < i ? base[j][i] : v)))
}

/** 自分に強く引かれ、次の種類を少し追う。色の順に連なった鎖ができる */
export const snakeMatrix = (n: number): Matrix =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (j === i) return 1
      if (j === (i + 1) % n) return 0.2
      return 0
    })
  )

export const zeroMatrix = (n: number): Matrix =>
  Array.from({ length: n }, () => Array.from({ length: n }, () => 0))

export const createWorld = (
  count: number,
  typeCount: number,
  rng: Rng = Math.random
): World => {
  const types = new Uint8Array(count)
  const x = new Float32Array(count)
  const y = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    types[i] = Math.floor(rng() * typeCount)
    x[i] = rng()
    y[i] = rng()
  }

  return {
    count,
    types,
    x,
    y,
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    near: new Uint16Array(count),
  }
}

type Grid = { size: number; start: Int32Array; items: Int32Array }

// rMax 四方のセルに粒子を振り分ける (counting sort)。近傍探索を 3×3 セルに限定するため
const buildGrid = (world: World, rMax: number): Grid => {
  const size = Math.max(1, Math.floor(1 / rMax))
  const cellOf = new Int32Array(world.count)
  const start = new Int32Array(size * size + 1)

  for (let i = 0; i < world.count; i++) {
    const cx = Math.min(size - 1, Math.floor(world.x[i] * size))
    const cy = Math.min(size - 1, Math.floor(world.y[i] * size))
    const c = cy * size + cx

    cellOf[i] = c
    start[c + 1]++
  }
  for (let c = 0; c < size * size; c++) start[c + 1] += start[c]

  const fill = start.slice(0, size * size)
  const items = new Int32Array(world.count)

  for (let i = 0; i < world.count; i++) items[fill[cellOf[i]]++] = i

  return { size, start, items }
}

// セル数が 3 未満だと 3×3 近傍が同じセルを重複して数えるので、全探索に切り替える
const MIN_GRID_SIZE = 3

// セルごとの近傍セル一覧。粒子ごとに組み立てると毎フレーム数千の配列確保になるので先に作る
const neighborTable = (size: number): number[][] =>
  Array.from({ length: size * size }, (_, c) => {
    if (size < MIN_GRID_SIZE)
      return Array.from({ length: size * size }, (_, k) => k)
    const cx = c % size
    const cy = Math.floor(c / size)

    return [-1, 0, 1].flatMap((dy) =>
      [-1, 0, 1].map(
        (dx) => ((cy + dy + size) % size) * size + ((cx + dx + size) % size)
      )
    )
  })

const flatten = (matrix: Matrix): Float32Array => {
  const n = matrix.length
  const flat = new Float32Array(n * n)

  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      flat[i * n + j] = v
    })
  })
  return flat
}

type Ctx = {
  world: World
  grid: Grid
  neighbors: number[][]
  attraction: Float32Array
  typeCount: number
  rMax: number
}

// 粒子 i が受ける力を out[0], out[1]、近傍数を out[2] に書く (タプルを返すと粒子ごとに配列を確保するため)
const accumulate = (ctx: Ctx, i: number, out: Float32Array): void => {
  const { world, grid, attraction, typeCount, rMax } = ctx
  const { x, y, types } = world
  const xi = x[i]
  const yi = y[i]
  const cx = Math.min(grid.size - 1, Math.floor(xi * grid.size))
  const cy = Math.min(grid.size - 1, Math.floor(yi * grid.size))
  const rowOffset = types[i] * typeCount
  const r2Max = rMax * rMax
  let fx = 0
  let fy = 0
  let near = 0

  for (const c of ctx.neighbors[cy * grid.size + cx]) {
    for (let k = grid.start[c]; k < grid.start[c + 1]; k++) {
      const j = grid.items[k]
      const dx = wrapDelta(x[j] - xi)
      const dy = wrapDelta(y[j] - yi)
      const d2 = dx * dx + dy * dy

      // j === i は d2 === 0 で弾かれる
      if (d2 === 0 || d2 >= r2Max) continue
      const dist = Math.sqrt(d2)
      const f = force(dist / rMax, attraction[rowOffset + types[j]] ?? 0)

      fx += (dx / dist) * f
      fy += (dy / dist) * f
      near++
    }
  }
  out[0] = fx
  out[1] = fy
  out[2] = near
}

/** dt 秒ぶん進める (world を書き換える) */
export const step = (
  world: World,
  matrix: Matrix,
  params: Params,
  dt: number
): void => {
  const { rMax, frictionHalfLife, forceFactor } = params
  const grid = buildGrid(world, rMax)
  const ctx: Ctx = {
    world,
    grid,
    neighbors: neighborTable(grid.size),
    attraction: flatten(matrix),
    typeCount: matrix.length,
    rMax,
  }
  const damping = 0.5 ** (dt / frictionHalfLife)
  const ax = new Float32Array(world.count)
  const ay = new Float32Array(world.count)
  const out = new Float32Array(3)

  // 全員の力を出してから動かす (順に動かすと先に動いた粒子の位置で後続の力が歪む)
  for (let i = 0; i < world.count; i++) {
    accumulate(ctx, i, out)
    ax[i] = out[0] * rMax * forceFactor
    ay[i] = out[1] * rMax * forceFactor
    world.near[i] = out[2]
  }
  for (let i = 0; i < world.count; i++) {
    world.vx[i] = world.vx[i] * damping + ax[i] * dt
    world.vy[i] = world.vy[i] * damping + ay[i] * dt
    world.x[i] = wrap01(world.x[i] + world.vx[i] * dt)
    world.y[i] = wrap01(world.y[i] + world.vy[i] * dt)
  }
}
