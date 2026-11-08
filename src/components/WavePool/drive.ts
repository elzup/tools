// 円周に並べた造波機それぞれの振幅と位相を決める純粋関数群。
// 座標の単位は呼び出し側で揃える (格子セルでもプール半径 = 1 でもよい)

export type Vec = { x: number; y: number }

export type Drive = {
  /** 0..1 に正規化した振幅 */
  amp: number
  /** ラジアン (-π..π] */
  phase: number
}

// 波源がターゲットに重なると 1/√r が発散する。
// 実際の造波機には大きさがあるので、1 セル程度より近い距離は丸める
const MIN_DISTANCE = 1e-3

/** 円周上に等間隔で count 個並べる。角度 0 は +x 方向 */
export const ringPositions = (
  count: number,
  center: Vec,
  radius: number
): Vec[] =>
  Array.from({ length: count }, (_, j) => {
    const theta = (2 * Math.PI * j) / count
    return {
      x: center.x + radius * Math.cos(theta),
      y: center.y + radius * Math.sin(theta),
    }
  })

const distance = (a: Vec, b: Vec) =>
  Math.max(MIN_DISTANCE, Math.hypot(a.x - b.x, a.y - b.y))

/**
 * 時間反転 (位相共役) で駆動を求める。
 *
 * 波源 j を cos(ωt + φ_j) で揺らすと、距離 r のターゲットには
 * 2D 自由空間のグリーン関数近似で (1/√r) cos(ωt + φ_j − k r) が届く。
 * ターゲットで全波源の山を揃えたいので φ_j = k r を選ぶ (伝搬位相の共役)。
 * ターゲットが複数あるときは各ターゲットの共役を複素数で足し合わせ、
 * その偏角を位相、絶対値を振幅にする (重ね合わせで全ターゲットに同時に焦点を作る)
 */
export const timeReversalDrive = (
  sources: Vec[],
  targets: Vec[],
  k: number
): Drive[] => {
  if (targets.length === 0) return uniformDrive(sources.length)

  const raw = sources.map((src) => {
    const sum = targets.reduce(
      (acc, target) => {
        const r = distance(src, target)
        const w = 1 / Math.sqrt(r)
        return {
          re: acc.re + w * Math.cos(k * r),
          im: acc.im + w * Math.sin(k * r),
        }
      },
      { re: 0, im: 0 }
    )
    return {
      mag: Math.hypot(sum.re, sum.im),
      phase: Math.atan2(sum.im, sum.re),
    }
  })
  const maxMag = Math.max(...raw.map((d) => d.mag))
  if (maxMag === 0) return uniformDrive(sources.length)

  return raw.map((d) => ({ amp: d.mag / maxMag, phase: d.phase }))
}

/** 位相制御なし (全波源同振幅・同位相)。比較用の基準 */
export const uniformDrive = (count: number): Drive[] =>
  Array.from({ length: count }, () => ({ amp: 1, phase: 0 }))

/** 波源 j の信号がターゲットに届いたときの位相 (φ_j − k r)。-π..π に畳む */
export const arrivalPhase = (
  source: Vec,
  drive: Drive,
  target: Vec,
  k: number
): number => wrapPhase(drive.phase - k * distance(source, target))

export const wrapPhase = (phase: number): number => {
  const twoPi = 2 * Math.PI
  const wrapped = (((phase + Math.PI) % twoPi) + twoPi) % twoPi
  return wrapped - Math.PI
}
