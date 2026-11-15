// 複数ターゲットに同時に焦点を作る駆動を、重み付き Gerchberg–Saxton 法で求める。
//
// 時間反転の単純和 (timeReversalDrive) はターゲット間の相対位相を全部 0 に固定するので、
// ターゲット同士の波が干渉して打ち消し合い、点が増えるほど形が崩れる。
// 各ターゲットの位相は本来自由に選べる (水面の明るさ = 振幅の 2 乗しか見ない) ので、
// 「逆伝搬で駆動を作る → 順伝搬でターゲットの場を求める → 位相だけ採用して振幅を目標に戻す」を繰り返す

import { type Drive, type Vec, uniformDrive } from './drive'

type Complex = { re: number; im: number }

// 60 回で各点の明るさのばらつき (変動係数) が 0.1 前後まで下がり、それ以上はほぼ変わらない
export const GS_ITERATIONS = 60
// 弱い点の目標振幅を (平均 / 現在)^γ 倍して持ち上げる。1 だと振動し、0.5 で安定して揃う
const WEIGHT_GAMMA = 0.5
// drive.ts と同じく、波源がターゲットに重なったときの 1/√r の発散を丸める
const MIN_DISTANCE = 1e-3

/** 波源 j を e^{iφ} で揺らしたとき点 m に届く複素振幅の係数 e^{−ikr}/√r (2D グリーン関数の遠方近似) */
const propagator = (sources: Vec[], targets: Vec[], k: number): Complex[][] =>
  targets.map((t) =>
    sources.map((s) => {
      const r = Math.max(MIN_DISTANCE, Math.hypot(t.x - s.x, t.y - s.y))
      const w = 1 / Math.sqrt(r)
      return { re: w * Math.cos(k * r), im: -w * Math.sin(k * r) }
    })
  )

/** a_j = Σ_m conj(G_mj)·t_m。造波機の上限に合わせて最大振幅 1 に正規化する */
const backPropagate = (G: Complex[][], field: Complex[], count: number) => {
  const raw = Array.from({ length: count }, (_, j) =>
    field.reduce(
      (acc, t, m) => {
        const g = G[m][j]
        return {
          re: acc.re + g.re * t.re + g.im * t.im,
          im: acc.im + g.re * t.im - g.im * t.re,
        }
      },
      { re: 0, im: 0 }
    )
  )
  const maxMag = Math.max(...raw.map((a) => Math.hypot(a.re, a.im)))
  if (maxMag === 0) return raw
  return raw.map((a) => ({ re: a.re / maxMag, im: a.im / maxMag }))
}

/** u_m = Σ_j G_mj·a_j */
const forwardPropagate = (G: Complex[][], drive: Complex[]): Complex[] =>
  G.map((row) =>
    row.reduce(
      (acc, g, j) => ({
        re: acc.re + g.re * drive[j].re - g.im * drive[j].im,
        im: acc.im + g.re * drive[j].im + g.im * drive[j].re,
      }),
      { re: 0, im: 0 }
    )
  )

/** 各ターゲットに届く振幅 (順伝搬)。テストと評価用 */
export const targetAmplitudes = (
  sources: Vec[],
  drives: Drive[],
  targets: Vec[],
  k: number
): number[] => {
  const drive = drives.map((d) => ({
    re: d.amp * Math.cos(d.phase),
    im: d.amp * Math.sin(d.phase),
  }))
  return forwardPropagate(propagator(sources, targets, k), drive).map((u) =>
    Math.hypot(u.re, u.im)
  )
}

export const hologramDrive = (
  sources: Vec[],
  targets: Vec[],
  k: number,
  iterations = GS_ITERATIONS
): Drive[] => {
  if (targets.length === 0) return uniformDrive(sources.length)
  const G = propagator(sources, targets, k)

  let weights = targets.map(() => 1)
  let field: Complex[] = targets.map(() => ({ re: 1, im: 0 }))
  let drive = backPropagate(G, field, sources.length)
  for (let it = 1; it < iterations; it++) {
    const u = forwardPropagate(G, drive)
    const amps = u.map((z) => Math.hypot(z.re, z.im))
    const mean = amps.reduce((s, v) => s + v, 0) / amps.length
    weights = weights.map(
      (w, m) => w * (mean / Math.max(Number.EPSILON, amps[m])) ** WEIGHT_GAMMA
    )
    field = u.map((z, m) => {
      const phase = Math.atan2(z.im, z.re)
      return {
        re: weights[m] * Math.cos(phase),
        im: weights[m] * Math.sin(phase),
      }
    })
    drive = backPropagate(G, field, sources.length)
  }

  return drive.map((a) => ({
    amp: Math.hypot(a.re, a.im),
    phase: Math.atan2(a.im, a.re),
  }))
}
