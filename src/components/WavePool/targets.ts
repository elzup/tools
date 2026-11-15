import type { Vec } from './drive'

// ターゲット形状はプール半径 = 1、中心 = 原点の座標で持つ。
// 線や輪郭は spacing (焦点 1 個の幅 ≈ λ/2) ごとの点群に置き換える。
// 間隔がそれより粗いと点の列にしか見えず、細かくしても独立に作れる焦点は増えない

export type ShapeKind =
  | 'point'
  | 'twoPoints'
  | 'ring'
  | 'line'
  | 'triangle'
  | 'custom'

export type IconKind = 'heart' | 'star' | 'bolt' | 'house' | 'droplet'

export type TargetKind = ShapeKind | IconKind

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  point: '1 点',
  twoPoints: '2 点',
  ring: 'リング',
  line: '直線',
  triangle: '三角形',
  custom: '自由配置',
}

export const ICON_LABELS: Record<IconKind, string> = {
  heart: 'ハート',
  star: '星',
  bolt: '稲妻',
  house: '家',
  droplet: 'しずく',
}

export const isIconKind = (kind: TargetKind): kind is IconKind =>
  kind in ICON_LABELS

const RING_RADIUS = 0.45
// 円は多角形で近似してから spacing で刻み直す。72 角形なら刻みより十分細かい
const RING_VERTICES = 72
const LINE_HALF = 0.5
const TRIANGLE_RADIUS = 0.5
export const CUSTOM_MAX = 12
// 壁際は波源の近接場が支配的で焦点の意味が薄いので、置ける範囲を内側に限る
export const PLACEABLE_RADIUS = 0.85

const polygon = (sides: number, radius: number): Vec[] =>
  Array.from({ length: sides }, (_, i) => {
    // 頂点を真上から始めると三角形が正立して見える
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / sides
    return { x: radius * Math.cos(theta), y: radius * Math.sin(theta) }
  })

/** 折れ線を弧長 spacing ごとに刻む。closed なら最後の頂点から最初へも結ぶ */
export const samplePath = (
  vertices: Vec[],
  spacing: number,
  closed: boolean
): Vec[] => {
  const segments = vertices
    .slice(0, closed ? vertices.length : vertices.length - 1)
    .map((a, i) => ({ a, b: vertices[(i + 1) % vertices.length] }))
  const lengths = segments.map(({ a, b }) => Math.hypot(b.x - a.x, b.y - a.y))
  const total = lengths.reduce((s, v) => s + v, 0)
  // 閉曲線は継ぎ目で点が重ならないよう、周長を割り切れる間隔に合わせる
  const count = closed
    ? Math.max(1, Math.round(total / spacing))
    : Math.max(1, Math.round(total / spacing)) + 1
  const step = closed ? total / count : total / (count - 1)

  return Array.from({ length: count }, (_, i) => {
    let rest = i * step
    for (let s = 0; s < segments.length; s++) {
      if (rest <= lengths[s] || s === segments.length - 1) {
        const { a, b } = segments[s]
        const t = lengths[s] === 0 ? 0 : Math.min(1, rest / lengths[s])
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      }
      rest -= lengths[s]
    }
    return vertices[0]
  })
}

export const buildTargets = (
  kind: ShapeKind,
  pointer: Vec,
  custom: Vec[],
  spacing: number
): Vec[] => {
  switch (kind) {
    case 'point':
      return [pointer]
    case 'twoPoints':
      return [
        { x: -0.35, y: 0.15 },
        { x: 0.35, y: -0.15 },
      ]
    case 'ring':
      return samplePath(polygon(RING_VERTICES, RING_RADIUS), spacing, true)
    case 'line':
      return samplePath(
        [
          { x: -LINE_HALF, y: 0 },
          { x: LINE_HALF, y: 0 },
        ],
        spacing,
        false
      )
    case 'triangle':
      return samplePath(polygon(3, TRIANGLE_RADIUS), spacing, true)
    case 'custom':
      return custom
  }
}

/** 半径 PLACEABLE_RADIUS の内側に収める */
export const clampToPool = (p: Vec): Vec => {
  const r = Math.hypot(p.x, p.y)
  if (r <= PLACEABLE_RADIUS) return p
  const s = PLACEABLE_RADIUS / r
  return { x: p.x * s, y: p.y * s }
}
