import blocksJson from '../../data/unicodeBlocks.json'
import type { Block } from './colors'

export const N = 256
export const TOTAL = N * N // BMP = 65,536 codepoints
export const CELL = 4
export const SIZE = N * CELL // 1024px
export const MAX_WALL_LEVEL = 4

export const blocks = blocksJson as Block[]

/** BMP に範囲を持つブロックのみ */
export const bmpBlocks = blocks.filter((b) =>
  b.ranges.some(([lo]) => lo <= 0xffff)
)

/** SMP (U+10000 以降) に範囲を持つレアブロック */
export const smpBlocks = blocks.filter((b) =>
  b.ranges.some(([lo]) => lo > 0xffff)
)

export const countOf = (block: Block) =>
  block.ranges.reduce((sum, [lo, hi]) => sum + (hi - lo + 1), 0)

/** codepoint -> blocks の index (-1 = 未割当) */
export const buildBlockIndex = () => {
  const index = new Int16Array(TOTAL).fill(-1)

  blocks.forEach((block, i) => {
    for (const [lo, hi] of block.ranges) {
      if (lo >= TOTAL) continue
      for (let cp = lo; cp <= Math.min(hi, TOTAL - 1); cp++) index[cp] = i
    }
  })
  return index
}

export const toHex = (cp: number) =>
  `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
