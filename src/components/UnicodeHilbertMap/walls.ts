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

/** 表示座標 (y * order + x) -> 曲線上の通し番号 d */
const cellIndexMap = (order: number) => {
  const dAt = new Int32Array(order * order)

  for (let d = 0; d < order * order; d++) dAt[cellId(order, d2xy(order, d))] = d
  return dAt
}

/** 複数ブロックにまたがる区画を表す番兵 */
export const MIXED_BLOCK = -2

/**
 * Lv.L の区画ごとに、そこに含まれるブロックを求める。
 * ヒルベルト曲線の自己相似性から、通し番号 d の区画は
 * codepoint [d * cellCp, (d + 1) * cellCp) をちょうど覆う。
 * 単一ブロックなら blocks の index、複数にまたがるなら MIXED_BLOCK。
 */
export const buildCellBlocks = (level: number, blockIndex: Int16Array) => {
  const cells = new Int16Array(4 ** level)
  const cellCp = blockIndex.length / cells.length

  for (let d = 0; d < cells.length; d++) {
    const head = blockIndex[d * cellCp]
    let value = head

    for (let k = 1; k < cellCp; k++) {
      if (blockIndex[d * cellCp + k] !== head) {
        value = MIXED_BLOCK
        break
      }
    }
    cells[d] = value
  }
  return cells
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
export const buildWalls = (
  level: number,
  cellBlocks: Int16Array | null = null
): Wall[] => {
  if (level <= 0) return []
  const order = 2 ** level
  const cell = SIZE / order
  const traversed = traversedEdges(order)
  const dAt = cellIndexMap(order)
  const walls: Wall[] = []
  // 両脇が同じ 1 ブロックに収まる壁は落とす (MIXED_BLOCK は「同じ」とみなさない)
  const isInsideBlock = (a: Cell, b: Cell) => {
    if (!cellBlocks) return false
    const ba = cellBlocks[dAt[cellId(order, a)]]

    return ba !== MIXED_BLOCK && ba === cellBlocks[dAt[cellId(order, b)]]
  }

  for (let x = 1; x < order; x++) {
    for (let y = 0; y < order; y++) {
      const [a, b]: [Cell, Cell] = [
        [x - 1, y],
        [x, y],
      ]

      if (traversed.has(edgeId(order, a, b))) continue
      if (isInsideBlock(a, b)) continue
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
      const [a, b]: [Cell, Cell] = [
        [x, y - 1],
        [x, y],
      ]

      if (traversed.has(edgeId(order, a, b))) continue
      if (isInsideBlock(a, b)) continue
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
