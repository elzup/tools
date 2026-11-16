export type Vec = { x: number; y: number }

// ループ折れ線の接続位置。1 段の長さで正規化した比率 (0〜1)
export type LoopRatios = {
  j1: number // 噴射口 (ループ → 主流路)
  p1: number // 噴射側の脚の折れ点
  p2: number // 天井の起点
  p3: number // 天井の終点
  j2: number // 取り込み口 (主流路 → ループ)
}

export type ValveParams = {
  units: number // 段数 (valvular conduit の 1 段 = 主流路 + 戻しループ)。交互配置のため偶数
  unitLength: number // 1 段の長さ [格子]
  height: number // 計算領域の高さ [格子]
  channelHalf: number // 主流路の半幅 [格子]
  loopHalf: number // ループ流路の半幅 [格子]
  loopHeight: number // 主流路中心線からループ天井の中心線までの距離 [格子]
  waveAmp: number // 主流路中心線の蛇行振幅 [格子]。0 で直線
  alternate: boolean // 段ごとにループを上下へ振る (Tesla の図と同じ見た目)
  loops: boolean // false で蛇行だけの流路。整流比の基準 (D≒1) を取る比較用
  loopRatios?: LoopRatios // 省略時は TESLA_LOOP_RATIOS (特許再現)
}

export type Geometry = {
  nx: number
  ny: number
  centerY: number
  solid: Uint8Array // 1 = 壁。流体セルの補集合なので外周も自動的に壁になる
  fluidCount: number
  params: ValveParams
}

// Tesla の特許 (US1329559) の図から目分量で取った比率
export const TESLA_LOOP_RATIOS: LoopRatios = {
  j1: 0.37,
  p1: 0.1,
  p2: 0.07,
  p3: 0.62,
  j2: 0.95,
}

export const DEFAULT_PARAMS: ValveParams = {
  units: 4,
  unitLength: 48,
  height: 80,
  channelHalf: 8,
  loopHalf: 6,
  loopHeight: 25,
  waveAmp: 5,
  alternate: true,
  loops: true,
}

// この形状族のパラメータを格子探索して整流比を最大化したもの
// (2026-11 計測: 4 段・Re~120 で D 1.34 → 1.80。順方向流量も 0.866 → 0.893 に微増)
export const OPTIMIZED_PARAMS: ValveParams = {
  ...DEFAULT_PARAMS,
  loopHalf: 8,
  loopRatios: { ...TESLA_LOOP_RATIOS, p1: 0.02, p3: 0.4 },
}

export type Capsule = { a: Vec; b: Vec; half: number }

const sideOf = (unit: number, alternate: boolean): 1 | -1 =>
  alternate && Math.abs(unit % 2) === 1 ? 1 : -1

// 主流路の中心線。段ごとにループ側へ寄せてから反対側へ振る蛇行にしてある。
// 逆流 (-x) は取り込み口の手前でループ側へ向いた流路を走るので慣性でループへ入り、
// 順流 (+x) は同じ流路をループから離れる向きに走るので素通りする。
// この慣性による振り分けが Tesla の図で主流路がうねっている理由。
const channelWaypoints = (params: ValveParams, centerY: number): Vec[] => {
  const { units, unitLength: length, waveAmp: amp, alternate } = params

  // 周期境界をまたぐ分だけ前後に 1 段ずつ延長する
  return Array.from({ length: units + 2 }, (_, i) => i - 1).flatMap((unit) => {
    const side = sideOf(unit, alternate)

    return [
      { x: (unit + 0.35) * length, y: centerY - side * amp },
      { x: (unit + 0.85) * length, y: centerY + side * amp },
    ]
  })
}

const interpolateY = (points: Vec[], x: number): number => {
  const next = points.findIndex((p) => p.x >= x)

  if (next <= 0) return points[Math.max(next, 0)].y

  const a = points[next - 1]
  const b = points[next]

  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x)
}

// ループの折れ線。順方向 (+x) を「流れやすい向き」にする非対称性はここに集約されている。
//   - 左端 J1 は主流路へ浅い角度で開く噴射口。逆流時はここから +x へ噴き出し、
//     主流路を逆走してくる流れに正面衝突して大きな損失を作る
//   - 右端 J2 は主流路から見て鋭角に開く取り込み口。逆流 (-x) は 60° 程度の曲がりで
//     ループへ入れるが、順流 (+x) は 120° 曲がらないと入れないのでほとんど入らない
// 比率は段長で正規化しているので unitLength を変えても形は崩れない。
const loopCapsules = (
  unit: number,
  params: ValveParams,
  channel: Vec[],
  centerY: number
): Capsule[] => {
  const { unitLength: length, loopHeight: top, loopHalf: half } = params
  const ratios = params.loopRatios ?? TESLA_LOOP_RATIOS
  const side = sideOf(unit, params.alternate)
  const x0 = unit * length
  const at = (ratio: number, offset: number): Vec => ({
    x: x0 + length * ratio,
    // 主流路に接する端点は蛇行に追従させる。追従しないと接続部が壁で塞がる
    y:
      offset === 0
        ? interpolateY(channel, x0 + length * ratio)
        : centerY + side * offset,
  })
  const j1 = at(ratios.j1, 0) // 噴射口
  const p1 = at(ratios.p1, top * 0.45)
  const p2 = at(ratios.p2, top)
  const p3 = at(ratios.p3, top)
  const j2 = at(ratios.j2, 0) // 取り込み口

  return [
    { a: p1, b: j1, half },
    { a: p2, b: p1, half },
    { a: p3, b: p2, half },
    { a: j2, b: p3, half },
  ]
}

export const capsulesOf = (params: ValveParams, ny: number): Capsule[] => {
  const centerY = ny / 2
  const channel = channelWaypoints(params, centerY)
  const mainPipe: Capsule[] = channel
    .slice(1)
    .map((b, i) => ({ a: channel[i], b, half: params.channelHalf }))

  if (!params.loops) return mainPipe

  const loops = Array.from({ length: params.units }, (_, unit) =>
    loopCapsules(unit, params, channel, centerY)
  ).flat()

  return [...mainPipe, ...loops]
}

// 点と線分の距離 (カプセル内なら負)。x は周期境界なので ±nx ずらした像との最小値を取る
const distToCapsule = (p: Vec, { a, b, half }: Capsule, nx: number): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy

  return [-nx, 0, nx].reduce((min, shift) => {
    const px = p.x + shift - a.x
    const py = p.y - a.y
    const t =
      lenSq === 0 ? 0 : Math.min(1, Math.max(0, (px * dx + py * dy) / lenSq))

    return Math.min(min, Math.hypot(px - t * dx, py - t * dy) - half)
  }, Number.POSITIVE_INFINITY)
}

export const buildGeometry = (params: ValveParams): Geometry => {
  const nx = params.units * params.unitLength
  const ny = params.height
  const centerY = ny / 2
  const capsules = capsulesOf(params, ny)
  const solid = new Uint8Array(nx * ny).fill(1)
  let fluidCount = 0

  for (let y = 1; y < ny - 1; y++) {
    for (let x = 0; x < nx; x++) {
      // セル中心で判定する。格子点で判定すると壁が半セルずれて流路幅が 1 セル狂う
      const p = { x: x + 0.5, y: y + 0.5 }

      if (!capsules.some((c) => distToCapsule(p, c, nx) <= 0)) continue

      solid[y * nx + x] = 0
      fluidCount++
    }
  }

  return { nx, ny, centerY, solid, fluidCount, params }
}
