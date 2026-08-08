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

export type Vec2 = { x: number; y: number }

export type PlanContext = {
  gain: number[]
  forceMax: number
  /** レール境界 (プランナー座標系での下限/上限。目標相対座標なら target 分ずらして渡す) */
  trackLow: number
  trackHigh: number
}

/** この内側なら計画不要で LQR に任せる */
export const isCalm = (s: State): boolean =>
  Math.abs(s[1]) < 0.15 &&
  Math.abs(s[2]) < 0.15 &&
  Math.abs(s[4]) < 1.0 &&
  Math.abs(s[5]) < 1.2

const lqrForce = (s: State, ctx: PlanContext): number => {
  const u = -ctx.gain.reduce((sum, k, i) => sum + k * s[i], 0)

  return Math.max(-ctx.forceMax, Math.min(ctx.forceMax, u))
}

const planStep = (
  s: State,
  u: number,
  fx: number,
  fy: number,
  ctx: PlanContext
): State => {
  const n = rk4Step(s, u, 1 / 240, fx, fy)

  if (n[0] < ctx.trackLow || n[0] > ctx.trackHigh) {
    const clamped = Math.max(ctx.trackLow, Math.min(ctx.trackHigh, n[0]))

    return n.map((v, i) => {
      if (i === 0) return clamped
      if (i === 3) return 0
      return v
    })
  }
  return n
}

const isFallenState = (s: State) =>
  Math.cos(s[1]) < 0.15 || Math.cos(s[2]) < 0.15

const rolloutCost = (s: State) =>
  40 * s[1] * s[1] +
  40 * s[2] * s[2] +
  1.5 * s[4] * s[4] +
  1.5 * s[5] * s[5] +
  0.3 * s[0] * s[0] +
  0.3 * s[3] * s[3]

const PLAN_PREFIXES: (number | null)[] = [
  null,
  -1,
  -2 / 3,
  -1 / 3,
  1 / 3,
  2 / 3,
  1,
]
const PREFIX_STEPS = 48 // 0.2 s
const TAIL_STEPS = 120 // 0.5 s
const FALL_PENALTY = 1e6

export type PlanResult = { prefix: number | null; cost: number }

/**
 * 安定域外のリカバリ計画。先頭 0.2 秒の一定力 (null = 最初から LQR) を
 * 7 候補ロールアウトし、0.7 秒後に最も直立へ近づく候補とそのコストを返す。
 * LQR 継続も候補に含むため、LQR 単体より悪化しない。
 */
export const planRecoveryPrefix = (
  s0: State,
  ctx: PlanContext,
  fx = 0,
  fy = 0
): PlanResult => {
  let bestPrefix: number | null = null
  let bestCost = Number.POSITIVE_INFINITY

  for (const prefix of PLAN_PREFIXES) {
    const prefixForce = prefix === null ? null : prefix * ctx.forceMax
    let s = s0

    for (let t = 0; t < PREFIX_STEPS; t++)
      s = planStep(s, prefixForce ?? lqrForce(s, ctx), fx, fy, ctx)
    for (let t = 0; t < TAIL_STEPS; t++)
      s = planStep(s, lqrForce(s, ctx), fx, fy, ctx)
    let cost = rolloutCost(s) + (isFallenState(s) ? FALL_PENALTY : 0)

    // LQR 継続を同点時に優遇してチャタリングを防ぐ
    if (prefix === null) cost *= 0.95
    if (cost < bestCost) {
      bestCost = cost
      bestPrefix = prefixForce
    }
  }
  return { prefix: bestPrefix, cost: bestCost }
}

/**
 * 支点系での振り子の力学的エネルギー (カート速度の結合項は除外)。
 * 直立静止 = UPRIGHT_ENERGY, ぶら下がり静止 ≈ -UPRIGHT_ENERGY。
 * カート速度込みだと制御目標として暴れるため、swing-up はこちらを使う。
 */
export const pendulumEnergy = (s: State): number => {
  const [, th1, th2, , dth1, dth2] = s
  const { mass1, mass2, len1, len2, gravity } = PARAMS
  const c1 = Math.cos(th1)
  const c2 = Math.cos(th2)
  const c12 = Math.cos(th1 - th2)
  const v1sq = len1 * len1 * dth1 * dth1
  const v2sq =
    len1 * len1 * dth1 * dth1 +
    len2 * len2 * dth2 * dth2 +
    2 * len1 * len2 * c12 * dth1 * dth2

  return (
    0.5 * mass1 * v1sq +
    0.5 * mass2 * v2sq +
    mass1 * gravity * len1 * c1 +
    mass2 * gravity * (len1 * c1 + len2 * c2)
  )
}

export const UPRIGHT_ENERGY =
  (PARAMS.mass1 + PARAMS.mass2) * PARAMS.gravity * PARAMS.len1 +
  PARAMS.mass2 * PARAMS.gravity * PARAMS.len2

/**
 * エネルギーポンピング力。両リンクの結合項 σ を使うと dE/dt = k·deficit·σ² となり、
 * 不足時は注入・過剰時は抽出が常に正しい符号で効く。
 */
export const swingUpPump = (s: State, targetEnergy: number, ke: number) => {
  const { mass1, mass2, len1, len2 } = PARAMS
  const deficit = targetEnergy - pendulumEnergy(s)
  const sigma =
    (mass1 + mass2) * len1 * s[4] * Math.cos(s[1]) +
    mass2 * len2 * s[5] * Math.cos(s[2])

  return -ke * deficit * sigma
}

/**
 * 各ピン関節が伝えている拘束力 (N)。質点の加速度から反力を逆算する。
 * r1: リンク1がオモリ1に及ぼす力, r2: リンク2がオモリ2に及ぼす力,
 * onCart: リンク1がカートに及ぼす力 (= -r1 - リンク2の反作用経由分は r1 に含まれる)
 */
export const jointForces = (s: State, u: number, fx = 0, fy = 0) => {
  const [, th1, th2, , dth1, dth2] = s
  const { mass1, mass2, len1, len2, gravity } = PARAMS
  const [, , , ddx, ddth1, ddth2] = deriv(s, u, fx, fy)
  const c1 = Math.cos(th1)
  const s1 = Math.sin(th1)
  const c2 = Math.cos(th2)
  const s2 = Math.sin(th2)
  const a1x = ddx + len1 * (c1 * ddth1 - s1 * dth1 * dth1)
  const a1y = -len1 * (s1 * ddth1 + c1 * dth1 * dth1)
  const a2x = a1x + len2 * (c2 * ddth2 - s2 * dth2 * dth2)
  const a2y = a1y - len2 * (s2 * ddth2 + c2 * dth2 * dth2)
  // オモリ2: m2 a2 = m2 g + r2 + Fext → r2 = m2 (a2 - g) - Fext
  const r2: Vec2 = { x: mass2 * a2x - fx, y: mass2 * (a2y + gravity) - fy }
  // オモリ1: m1 a1 = m1 g + r1 - r2 → r1 = m1 (a1 - g) + r2
  const r1: Vec2 = {
    x: mass1 * a1x + r2.x,
    y: mass1 * (a1y + gravity) + r2.y,
  }

  return { r1, r2, onCart: { x: -r1.x, y: -r1.y } }
}
