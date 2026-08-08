// 円形皿の砂の高さ場と、回転ブレードによる整地ロジック

export const GRID = 180
export const RADIUS = GRID / 2 - 3
export const BLADE_INNER = 6

export type SandField = {
  height: Float32Array
  inside: Uint8Array
  /** 皿内セルを角度順に並べたもの (ブレード掃引用) */
  cellIdx: Int32Array
  cellAng: Float32Array
  cellR: Float32Array
}

export type BladeState = {
  angle: number
  /** 半径ビンごとにバーが押している砂の量 (バー前方の砂の波) */
  carry: Float32Array
  /** バー面の高さ。周回ごとに固定して、通過跡が同一平面に揃うようにする */
  level: number
}

export const createBlade = (): BladeState => ({
  angle: 0,
  carry: new Float32Array(RADIUS + 2),
  level: 0,
})

const TWO_PI = Math.PI * 2

export const createField = (): SandField => {
  const height = new Float32Array(GRID * GRID)
  const inside = new Uint8Array(GRID * GRID)
  const list: { idx: number; ang: number; r: number }[] = []
  const c = GRID / 2 - 0.5

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dx = x - c
      const dy = y - c
      const r = Math.hypot(dx, dy)

      if (r > RADIUS) continue
      const idx = y * GRID + x

      inside[idx] = 1
      list.push({ idx, ang: (Math.atan2(dy, dx) + TWO_PI) % TWO_PI, r })
    }
  }
  list.sort((a, b) => a.ang - b.ang)

  return {
    height,
    inside,
    cellIdx: Int32Array.from(list.map((cell) => cell.idx)),
    cellAng: Float32Array.from(list.map((cell) => cell.ang)),
    cellR: Float32Array.from(list.map((cell) => cell.r)),
  }
}

export const meanHeight = (field: SandField): number => {
  let sum = 0

  for (let i = 0; i < field.cellIdx.length; i++)
    sum += field.height[field.cellIdx[i]]
  return sum / field.cellIdx.length
}

/** 凹凸の RMS (平坦度指標) */
export const roughness = (field: SandField): number => {
  const mean = meanHeight(field)
  let sum = 0

  for (let i = 0; i < field.cellIdx.length; i++) {
    const d = field.height[field.cellIdx[i]] - mean

    sum += d * d
  }
  return Math.sqrt(sum / field.cellIdx.length)
}

/** ang 以上が始まる位置 (二分探索) */
const lowerBound = (arr: Float32Array, target: number): number => {
  let lo = 0
  let hi = arr.length

  while (lo < hi) {
    const mid = (lo + hi) >> 1

    if (arr[mid] < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

const sweepRange = (
  field: SandField,
  carry: Float32Array,
  from: number,
  to: number,
  level: number
) => {
  const start = lowerBound(field.cellAng, from)
  const end = lowerBound(field.cellAng, to)

  for (let i = start; i < end; i++) {
    const r = field.cellR[i]

    if (r < BLADE_INNER) continue
    const idx = field.cellIdx[i]
    const bin = Math.round(r)
    const d = field.height[idx] - level

    if (d > 0) {
      // バー面より上の砂は残さず全部バーが持っていく
      field.height[idx] = level
      carry[bin] += d
    } else if (d < 0 && carry[bin] > 0) {
      // くぼみは持っている砂でバー面の高さまで埋めて通過する
      const fill = Math.min(-d, carry[bin])

      field.height[idx] += fill
      carry[bin] -= fill
    }
  }
}

// 通過直後の均しの強さ (現実のバーは通過跡を真っ平らに残す)
const SMOOTH_RATE = 0.35

/** ブレードが通過した範囲を閾値なしで均して、縞を消す */
const smoothSweep = (field: SandField, from: number, to: number) => {
  const { height, inside } = field
  const start = lowerBound(field.cellAng, from)
  const end = lowerBound(field.cellAng, to)

  for (let i = start; i < end; i++) {
    const idx = field.cellIdx[i]
    const right = idx + 1
    const down = idx + GRID

    if (inside[right]) {
      const t = (height[idx] - height[right]) * SMOOTH_RATE * 0.5

      height[idx] -= t
      height[right] += t
    }
    if (inside[down]) {
      const t = (height[idx] - height[down]) * SMOOTH_RATE * 0.5

      height[idx] -= t
      height[down] += t
    }
  }
}

// carry がバーに沿って横 (半径方向) に流れる速さ
const CARRY_FLOW = 0.25

/** バー前方の砂の波は隣のビンへも流れて、量が均される */
const flowCarry = (carry: Float32Array) => {
  const prev = carry.slice()

  for (let i = BLADE_INNER; i <= RADIUS; i++) {
    const left = i > BLADE_INNER ? prev[i - 1] : prev[i]
    const right = i < RADIUS ? prev[i + 1] : prev[i]

    carry[i] = prev[i] + CARRY_FLOW * (left + right - 2 * prev[i])
  }
}

/**
 * ブレードを angleDelta だけ回す。通過セルのバー面より上の砂は残さず全部
 * バーが持っていき (半径ビンごとの carry = バー前方の砂の波)、
 * バー面より低い所を通るときに持っている分だけ埋めて置いていく。
 */
const computeLevel = (field: SandField, carry: Float32Array): number => {
  let carrySum = 0

  for (let i = BLADE_INNER; i <= RADIUS; i++) carrySum += carry[i]
  // 持っている砂も含めた全体平均をバー面の高さにする
  return meanHeight(field) + carrySum / field.cellIdx.length
}

export const advanceBlade = (
  field: SandField,
  blade: BladeState,
  angleDelta: number
): BladeState => {
  const delta = Math.min(angleDelta, TWO_PI)
  const from = blade.angle
  const to = from + delta
  let { level } = blade

  if (to <= TWO_PI) {
    sweepRange(field, blade.carry, from, to, level)
    smoothSweep(field, from, to)
  } else {
    sweepRange(field, blade.carry, from, TWO_PI, level)
    smoothSweep(field, from, TWO_PI)
    // 周回をまたぐタイミングでバー面の高さを更新する (周回中は固定)
    level = computeLevel(field, blade.carry)
    sweepRange(field, blade.carry, 0, to - TWO_PI, level)
    smoothSweep(field, 0, to - TWO_PI)
  }
  flowCarry(blade.carry)
  return { angle: to % TWO_PI, carry: blade.carry, level }
}

const REPOSE = 0.055
const SLUMP_RATE = 0.18

/** 安息角を超えた斜面の砂を隣へ崩す */
export const relaxSlopes = (field: SandField) => {
  const { height, inside } = field

  for (let y = 1; y < GRID - 1; y++) {
    for (let x = 1; x < GRID - 1; x++) {
      const idx = y * GRID + x

      if (!inside[idx]) continue
      const right = idx + 1
      const down = idx + GRID

      if (inside[right]) {
        const d = height[idx] - height[right]

        if (Math.abs(d) > REPOSE) {
          const t = (Math.abs(d) - REPOSE) * SLUMP_RATE * Math.sign(d)

          height[idx] -= t
          height[right] += t
        }
      }
      if (inside[down]) {
        const d = height[idx] - height[down]

        if (Math.abs(d) > REPOSE) {
          const t = (Math.abs(d) - REPOSE) * SLUMP_RATE * Math.sign(d)

          height[idx] -= t
          height[down] += t
        }
      }
    }
  }
}

/** ガウス形のくぼみ (depth < 0) や山 (depth > 0) を作る */
export const addMound = (
  field: SandField,
  cx: number,
  cy: number,
  radius: number,
  depth: number
) => {
  const r = Math.ceil(radius * 2)

  for (let y = Math.max(0, cy - r); y <= Math.min(GRID - 1, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x <= Math.min(GRID - 1, cx + r); x++) {
      const idx = y * GRID + x

      if (!field.inside[idx]) continue
      const dist2 = (x - cx) ** 2 + (y - cy) ** 2
      const w = Math.exp(-dist2 / (radius * radius))

      field.height[idx] = Math.max(
        -2.5,
        Math.min(2.5, field.height[idx] + depth * w)
      )
    }
  }
}

export const addRandomDents = (field: SandField, count: number) => {
  const c = GRID / 2

  for (let i = 0; i < count; i++) {
    const ang = Math.random() * TWO_PI
    const dist = Math.sqrt(Math.random()) * (RADIUS - 20)
    const cx = Math.round(c + Math.cos(ang) * dist)
    const cy = Math.round(c + Math.sin(ang) * dist)
    const radius = 6 + Math.random() * 10
    const depth = (Math.random() < 0.7 ? -1 : 1) * (0.4 + Math.random() * 0.8)

    addMound(field, cx, cy, radius, depth)
  }
}
