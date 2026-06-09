// 楕円ビリヤードの幾何計算 (純粋関数)
//
// 楕円: x²/a² + y²/b² = 1 (中心原点)
// 球は等速直線運動し、壁で完全反射する。time-step を積み重ねると誤差で
// 楕円の外へ逃げてしまうため、ここでは「光線と楕円の厳密な交点」を解析的に
// 解いて 1 跳ねごとに反射点を求める (mathematically exact billiard)。

export type Vec = { x: number; y: number }

export type Ball = {
  p: Vec // 現在位置
  d: Vec // 進行方向 (単位ベクトル)
  color: string
  vertices: Vec[] // 反射点の履歴 (軌跡ポリライン用)
}

const EPS = 1e-7

export const lengthOf = (v: Vec): number => Math.hypot(v.x, v.y)

export const normalize = (v: Vec): Vec => {
  const len = lengthOf(v)

  return len < EPS ? { x: 1, y: 0 } : { x: v.x / len, y: v.y / len }
}

// 楕円内部判定 (境界含む)
export const isInside = (p: Vec, a: number, b: number): boolean =>
  (p.x * p.x) / (a * a) + (p.y * p.y) / (b * b) <= 1 + EPS

// 焦点間距離 c = √(a² − b²)。a > b を前提 (横長楕円)
export const focusDistance = (a: number, b: number): number =>
  Math.sqrt(Math.max(0, a * a - b * b))

// 点 p から方向 d (単位) へ進んだとき、楕円境界までの距離 t を返す。
// (p+t·d) を楕円式に代入した 2 次方程式 A t² + B t + C = 0 を解く。
// 内部の点から発射した直後でも、再ヒット(t≈0)を避けて前方の解を選ぶ。
export const distanceToWall = (
  p: Vec,
  d: Vec,
  a: number,
  b: number
): number => {
  const ia2 = 1 / (a * a)
  const ib2 = 1 / (b * b)
  const A = d.x * d.x * ia2 + d.y * d.y * ib2
  const B = 2 * (p.x * d.x * ia2 + p.y * d.y * ib2)
  const C = p.x * p.x * ia2 + p.y * p.y * ib2 - 1
  const disc = B * B - 4 * A * C

  if (disc <= 0 || A < EPS) return Infinity

  const sq = Math.sqrt(disc)
  const t1 = (-B - sq) / (2 * A)
  const t2 = (-B + sq) / (2 * A)

  // 前方 (t > EPS) の最小解。直前の反射点への再ヒットを除外する。
  const forward = [t1, t2].filter((t) => t > 1e-4)

  return forward.length > 0 ? Math.min(...forward) : Infinity
}

// 境界点 q における外向き法線 ∝ (x/a², y/b²) を単位化して返す
export const wallNormal = (q: Vec, a: number, b: number): Vec =>
  normalize({ x: q.x / (a * a), y: q.y / (b * b) })

// 入射方向 d を法線 n で鏡面反射: d' = d − 2(d·n)n
export const reflect = (d: Vec, n: Vec): Vec => {
  const dot = d.x * n.x + d.y * n.y

  return normalize({ x: d.x - 2 * dot * n.x, y: d.y - 2 * dot * n.y })
}

// 球を距離 dist だけ進める。途中で壁に当たれば反射点を vertices に積み、
// 残り距離で反射方向へ進み続ける (1 フレームで複数回跳ねても破綻しない)。
export const advance = (
  ball: Ball,
  dist: number,
  a: number,
  b: number,
  maxVertices: number
): void => {
  let remaining = dist
  let guard = 0

  while (remaining > EPS && guard < 64) {
    guard++
    const toWall = distanceToWall(ball.p, ball.d, a, b)

    if (toWall === Infinity) break

    if (toWall > remaining) {
      ball.p = {
        x: ball.p.x + ball.d.x * remaining,
        y: ball.p.y + ball.d.y * remaining,
      }
      remaining = 0

      return
    }

    // 壁ヒット点で反射
    const q = {
      x: ball.p.x + ball.d.x * toWall,
      y: ball.p.y + ball.d.y * toWall,
    }
    const n = wallNormal(q, a, b)

    ball.d = reflect(ball.d, n)
    ball.p = q
    ball.vertices.push(q)

    if (ball.vertices.length > maxVertices) ball.vertices.shift()

    remaining -= toWall
  }
}
