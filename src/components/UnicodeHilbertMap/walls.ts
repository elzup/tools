import { d2xy } from './hilbert'
import { SIZE } from './mapData'

export type Wall = {
  x1: number
  y1: number
  x2: number
  y2: number
  /** その壁が現れる再帰レベル (小さいほど上位・太く描く) */
  depth: number
}

type Cell = readonly [number, number]

const cellId = (order: number, [x, y]: Cell) => y * order + x

/** 隣接 2 セルが共有する辺の ID (順序に依存しない) */
const edgeId = (order: number, a: Cell, b: Cell) => {
  const ia = cellId(order, a)
  const ib = cellId(order, b)

  return Math.min(ia, ib) * order * order + Math.max(ia, ib)
}

/** 曲線が連続して通り抜けた (= 壁がない) 辺を集める */
const traversedEdges = (order: number) => {
  const traversed = new Set<number>()
  let prev = d2xy(order, 0)

  for (let d = 1; d < order * order; d++) {
    const next = d2xy(order, d)

    traversed.add(edgeId(order, prev, next))
    prev = next
  }
  return traversed
}

/**
 * 分割線 k 本目が属する再帰レベル。
 * 例: order=4 (Lv.2) の k=2 は Lv.1 の中央線、k=1,3 は Lv.2 で増えた線。
 */
const depthOf = (k: number, level: number) => {
  let depth = level
  let value = k

  while (value % 2 === 0) {
    value /= 2
    depth--
  }
  return depth
}

/**
 * ヒルベルト曲線の壁 = 空間的には隣接しているのに曲線が通り抜けない境界。
 * Lv.1 なら中央から上に伸びる 1 本だけになる。
 */
export const buildWalls = (level: number): Wall[] => {
  if (level <= 0) return []
  const order = 2 ** level
  const cell = SIZE / order
  const traversed = traversedEdges(order)
  const walls: Wall[] = []

  for (let x = 1; x < order; x++) {
    for (let y = 0; y < order; y++) {
      if (traversed.has(edgeId(order, [x - 1, y], [x, y]))) continue
      walls.push({
        x1: x * cell,
        y1: y * cell,
        x2: x * cell,
        y2: (y + 1) * cell,
        depth: depthOf(x, level),
      })
    }
  }
  for (let y = 1; y < order; y++) {
    for (let x = 0; x < order; x++) {
      if (traversed.has(edgeId(order, [x, y - 1], [x, y]))) continue
      walls.push({
        x1: x * cell,
        y1: y * cell,
        x2: (x + 1) * cell,
        y2: y * cell,
        depth: depthOf(y, level),
      })
    }
  }
  return walls
}
