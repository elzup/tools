export interface PhysicsParams {
  G: number // 万有引力定数
  M: number // 大きな球の質量 (kg)
  m: number // 小さな球の質量 (kg)
  L: number // 天秤の腕の半分の長さ (m)
  D: number // 回転軸から大きな球の配置基準位置までの距離 (m)
  kappa: number // ワイヤーのねじり剛性 (N*m/rad)
  gamma: number // 減衰係数 (角速度に対する摩擦抵抗)
  theta0: number // 大きな球の配置位置の角度 (rad, 小さな球の釣り合い位置からのズレ)
  isExaggerated: boolean // 誇張モード (万有引力を大きくして動きを見やすくする)
}

export interface PhysicsState {
  theta: number // 現在の回転角 (rad)
  omega: number // 現在の角速度 (rad/s)
  bigSpherePos: 'left' | 'right' | 'none' // 大きな球の配置
}

// 実際の物理定数
export const REAL_G = 6.6743e-11

// デフォルトパラメータ
export const DEFAULT_PARAMS: PhysicsParams = {
  G: REAL_G,
  M: 1.5, // 1.5 kg
  m: 0.015, // 15 g
  L: 0.2, // 20 cm
  D: 0.22, // 22 cm
  kappa: 1e-7, // 非常に弱いねじりバネ
  gamma: 2e-8, // 減衰
  theta0: 0.25, // 約14度傾けた位置に大球を配置
  isExaggerated: true, // 初期状態は動きがわかりやすい誇張モード
}

// 誇張モード用の万有引力倍率
export const EXAGGERATION_MULTIPLIER = 1e6 // 100万倍

/**
 * 2つの球（小球・大球）の間の引力によるトルクを計算
 * 小球の座標: (L*cos(theta), L*sin(theta))
 * 大球の座標: (D*cos(phi), D*sin(phi))
 */
export function calculateTorque(
  theta: number,
  state: PhysicsState,
  params: PhysicsParams
): number {
  if (state.bigSpherePos === 'none') return 0

  const G_val = params.isExaggerated
    ? params.G * EXAGGERATION_MULTIPLIER
    : params.G
  const { M, m, L, D, theta0 } = params

  // 大球の位置（天秤の傾き theta に対し、大球は対称に2組配置）
  // 'left' 配置: 大球は小球の反時計回り方向 (theta + theta0) に配置
  // 'right' 配置: 大球は小球の時計回り方向 (theta - theta0) に配置
  const phi1 = state.bigSpherePos === 'left' ? theta0 : -theta0

  // 小球1の座標
  const s1x = L * Math.cos(theta)
  const s1y = L * Math.sin(theta)

  // 小球1に対応する大球1の座標
  const b1x = D * Math.cos(phi1)
  const b1y = D * Math.sin(phi1)

  // 小球1から大球1へのベクトル
  const dx1 = b1x - s1x
  const dy1 = b1y - s1y
  const r1_sq = dx1 * dx1 + dy1 * dy1
  const r1 = Math.sqrt(r1_sq)

  // 引力の大きさ F = G * M * m / r^2
  const F1 = (G_val * M * m) / r1_sq

  // トルク T = r_small x F
  // 力のベクトル: F_vec = (F * dx / r, F * dy / r)
  // トルク: T = s_x * F_y - s_y * F_x
  const torque1 = (s1x * (F1 * dy1) - s1y * (F1 * dx1)) / r1

  // 対称なもう一組（小球2と大球2）によるトルクも同じになるため2倍にする
  return 2 * torque1
}

/**
 * 加速度の計算: d^2(theta)/dt^2
 */
export function getAcceleration(
  theta: number,
  omega: number,
  state: PhysicsState,
  params: PhysicsParams
): number {
  const { m, L, kappa, gamma } = params
  // 棒の質量を無視した、2つの小球(m)による慣性モーメント I = 2 * m * L^2
  const I = 2 * m * L * L

  // 万有引力トルク
  const t_grav = calculateTorque(theta, state, params)

  // 復元力トルク (ねじりバネ)
  const t_spring = -kappa * theta

  // 減衰トルク
  const t_damping = -gamma * omega

  return (t_grav + t_spring + t_damping) / I
}

/**
 * RK4法を用いた1物理ステップの更新
 */
export function rk4Step(
  state: PhysicsState,
  params: PhysicsParams,
  dt: number
): PhysicsState {
  const t = state.theta
  const w = state.omega

  // k1
  const dw1 = getAcceleration(t, w, state, params)
  const dt1 = w

  // k2
  const t2 = t + dt1 * (dt / 2)
  const w2 = w + dw1 * (dt / 2)
  const dw2 = getAcceleration(t2, w2, state, params)
  const dt2 = w2

  // k3
  const t3 = t + dt2 * (dt / 2)
  const w3 = w + dw2 * (dt / 2)
  const dw3 = getAcceleration(t3, w3, state, params)
  const dt3 = w3

  // k4
  const t4 = t + dt3 * dt
  const w4 = w + dw3 * dt
  const dw4 = getAcceleration(t4, w4, state, params)
  const dt4 = w4

  const nextTheta = t + (dt / 6) * (dt1 + 2 * dt2 + 2 * dt3 + dt4)
  const nextOmega = w + (dt / 6) * (dw1 + 2 * dw2 + 2 * dw3 + dw4)

  return {
    ...state,
    theta: nextTheta,
    omega: nextOmega,
  }
}

/**
 * 固有周期の計算 T = 2 * pi * sqrt(I / kappa)
 */
export function calculatePeriod(params: PhysicsParams): number {
  const { m, L, kappa } = params
  const I = 2 * m * L * L
  return 2 * Math.PI * Math.sqrt(I / kappa)
}
