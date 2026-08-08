// 倒立二重振り子カートの力学と LQR ゲイン計算
// state: [x, th1, th2, dx, dth1, dth2] (th = 0 が直立)

export type State = number[]

export const PARAMS = {
  cartMass: 1.2,
  mass1: 0.3,
  mass2: 0.3,
  len1: 0.45,
  len2: 0.45,
  gravity: 9.81,
  cartDrag: 0.08,
  jointDamp1: 0.004,
  jointDamp2: 0.004,
}

const STATE_DIM = 6

/** 3x3 連立一次方程式をピボット付きガウス消去で解く */
const solve3 = (mat: number[][], vec: number[]): number[] => {
  const a = mat.map((row) => [...row])
  const x = [...vec]

  for (let c = 0; c < 3; c++) {
    let pivot = c
    for (let r = c + 1; r < 3; r++)
      if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r
    ;[a[c], a[pivot]] = [a[pivot], a[c]]
    ;[x[c], x[pivot]] = [x[pivot], x[c]]
    for (let r = c + 1; r < 3; r++) {
      const f = a[r][c] / a[c][c]

      for (let k = c; k < 3; k++) a[r][k] -= f * a[c][k]
      x[r] -= f * x[c]
    }
  }
  const out = [0, 0, 0]

  for (let r = 2; r >= 0; r--) {
    let s = x[r]

    for (let k = r + 1; k < 3; k++) s -= a[r][k] * out[k]
    out[r] = s / a[r][r]
  }
  return out
}

/** 運動方程式 (ラグランジュ導出)。fx, fy は先端オモリへの外力 */
export const deriv = (s: State, u: number, fx = 0, fy = 0): State => {
  const [, th1, th2, dx, dth1, dth2] = s
  const { cartMass, mass1, mass2, len1, len2, gravity } = PARAMS
  const { cartDrag, jointDamp1, jointDamp2 } = PARAMS
  const s1 = Math.sin(th1)
  const c1 = Math.cos(th1)
  const s2 = Math.sin(th2)
  const c2 = Math.cos(th2)
  const s12 = Math.sin(th1 - th2)
  const c12 = Math.cos(th1 - th2)
  const m12 = mass1 + mass2

  const massMat = [
    [cartMass + m12, m12 * len1 * c1, mass2 * len2 * c2],
    [m12 * len1 * c1, m12 * len1 * len1, mass2 * len1 * len2 * c12],
    [mass2 * len2 * c2, mass2 * len1 * len2 * c12, mass2 * len2 * len2],
  ]
  const rhs = [
    u +
      m12 * len1 * s1 * dth1 * dth1 +
      mass2 * len2 * s2 * dth2 * dth2 -
      cartDrag * dx +
      fx,
    m12 * gravity * len1 * s1 -
      mass2 * len1 * len2 * s12 * dth2 * dth2 -
      jointDamp1 * dth1 +
      fx * len1 * c1 -
      fy * len1 * s1,
    mass2 * gravity * len2 * s2 +
      mass2 * len1 * len2 * s12 * dth1 * dth1 -
      jointDamp2 * dth2 +
      fx * len2 * c2 -
      fy * len2 * s2,
  ]
  const [ddx, ddth1, ddth2] = solve3(massMat, rhs)

  return [dx, dth1, dth2, ddx, ddth1, ddth2]
}

export const rk4Step = (
  s: State,
  u: number,
  dt: number,
  fx = 0,
  fy = 0
): State => {
  const k1 = deriv(s, u, fx, fy)
  const s2 = s.map((v, i) => v + (dt / 2) * k1[i])
  const k2 = deriv(s2, u, fx, fy)
  const s3 = s.map((v, i) => v + (dt / 2) * k2[i])
  const k3 = deriv(s3, u, fx, fy)
  const s4 = s.map((v, i) => v + dt * k3[i])
  const k4 = deriv(s4, u, fx, fy)

  return s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
}

/** 直立平衡点まわりの線形化 (有限差分) */
const linearize = () => {
  const eps = 1e-5
  const a: number[][] = Array.from({ length: STATE_DIM }, () =>
    new Array(STATE_DIM).fill(0)
  )

  for (let j = 0; j < STATE_DIM; j++) {
    const sp = new Array(STATE_DIM).fill(0)
    const sm = new Array(STATE_DIM).fill(0)

    sp[j] = eps
    sm[j] = -eps
    const fp = deriv(sp, 0)
    const fm = deriv(sm, 0)

    for (let i = 0; i < STATE_DIM; i++) a[i][j] = (fp[i] - fm[i]) / (2 * eps)
  }
  const zero = new Array(STATE_DIM).fill(0)
  const fp = deriv(zero, eps)
  const fm = deriv(zero, -eps)
  const b = fp.map((v, i) => (v - fm[i]) / (2 * eps))

  return { a, b }
}

const matMul = (a: number[][], b: number[][]): number[][] =>
  a.map((row) =>
    b[0].map((_, j) => row.reduce((s, v, t) => s + v * b[t][j], 0))
  )

const transpose = (a: number[][]): number[][] =>
  a[0].map((_, j) => a.map((row) => row[j]))

/**
 * 離散時間 Riccati 反復 (value iteration) で LQR ゲイン K を求める。
 * u = -K (state - ref) で直立を維持する。
 */
export const computeLqrGain = (
  qDiag: number[],
  rWeight: number,
  dt = 0.002
): number[] => {
  const { a, b } = linearize()
  const ad = a.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) + v * dt))
  const bd = b.map((v) => v * dt)
  const q = qDiag.map((qv, i) => {
    const row = new Array(STATE_DIM).fill(0)

    row[i] = qv * dt
    return row
  })
  const r = rWeight * dt
  let p = q.map((row) => [...row])
  let gain = new Array(STATE_DIM).fill(0)

  for (let iter = 0; iter < 20000; iter++) {
    const btp = p.map((_, j) => bd.reduce((s, bv, i) => s + bv * p[i][j], 0))
    const den = r + btp.reduce((s, v, i) => s + v * bd[i], 0)
    const nextGain = ad[0].map((_, j) =>
      btp.reduce((s, v, t) => s + v * ad[t][j], 0)
    )

    for (let j = 0; j < STATE_DIM; j++) nextGain[j] /= den
    const acl = ad.map((row, i) => row.map((v, j) => v - bd[i] * nextGain[j]))
    const nextP = matMul(transpose(acl), matMul(p, acl))

    for (let i = 0; i < STATE_DIM; i++)
      for (let j = 0; j < STATE_DIM; j++)
        nextP[i][j] += q[i][j] + nextGain[i] * r * nextGain[j]

    const diff = Math.max(...nextGain.map((v, j) => Math.abs(v - gain[j])))

    gain = nextGain
    p = nextP
    if (iter > 10 && diff < 1e-9) break
  }
  return gain
}

/** カートと 2 つのオモリの描画用座標 (m) */
export const bodyPositions = (s: State) => {
  const [x, th1, th2] = s
  const { len1, len2 } = PARAMS
  const p1 = { x: x + len1 * Math.sin(th1), y: len1 * Math.cos(th1) }
  const p2 = { x: p1.x + len2 * Math.sin(th2), y: p1.y + len2 * Math.cos(th2) }

  return { cart: { x, y: 0 }, p1, p2 }
}
