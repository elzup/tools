import type { Vec } from './drive'

// ターゲット形状はプール半径 = 1、中心 = 原点の座標で持つ

export type TargetKind =
  | 'point'
  | 'twoPoints'
  | 'ring'
  | 'line'
  | 'triangle'
  | 'custom'

export const TARGET_LABELS: Record<TargetKind, string> = {
  point: '1 点',
  twoPoints: '2 点',
  ring: 'リング',
  line: '直線',
  triangle: '三角形',
  custom: '自由配置',
}

const RING_RADIUS = 0.45
const RING_POINTS = 20
const LINE_HALF = 0.5
const LINE_POINTS = 7
const TRIANGLE_RADIUS = 0.5
const POINTS_PER_EDGE = 3
export const CUSTOM_MAX = 12
// 壁際は波源の近接場が支配的で焦点の意味が薄いので、置ける範囲を内側に限る
export const PLACEABLE_RADIUS = 0.85

const lerp = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

const polygon = (sides: number, radius: number): Vec[] =>
  Array.from({ length: sides }, (_, i) => {
    // 頂点を真上から始めると三角形が正立して見える
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / sides
    return { x: radius * Math.cos(theta), y: radius * Math.sin(theta) }
  })

const edges = (vertices: Vec[], perEdge: number): Vec[] =>
  vertices.flatMap((v, i) => {
    const next = vertices[(i + 1) % vertices.length]
    return Array.from({ length: perEdge }, (_, j) => lerp(v, next, j / perEdge))
  })

export const buildTargets = (
  kind: TargetKind,
  pointer: Vec,
  custom: Vec[]
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
      return polygon(RING_POINTS, RING_RADIUS)
    case 'line':
      return Array.from({ length: LINE_POINTS }, (_, i) =>
        lerp(
          { x: -LINE_HALF, y: 0 },
          { x: LINE_HALF, y: 0 },
          i / (LINE_POINTS - 1)
        )
      )
    case 'triangle':
      return edges(polygon(3, TRIANGLE_RADIUS), POINTS_PER_EDGE)
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
