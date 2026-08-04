import blocksJson from '../../data/unicodeBlocks.json'
import type { Block } from './types'

export const N = 256
export const TOTAL = N * N // BMP = 65,536 codepoints
export const CELL = 4
export const SIZE = N * CELL // 1024px
/**
 * 壁の最大レベル。Lv.L の 1 セルは 65536 / 4^L codepoint で、
 * Lv.6 でちょうど 16 codepoint = Unicode ブロックのアドレス境界の単位になる。
 * これより深くすると 16 codepoint の内側を割るだけで、ブロックの境目とは対応しない。
 */
export const MAX_WALL_LEVEL = 6

/** Lv.L の 1 セルが何 codepoint 分か */
export const cellCodepointsAt = (level: number) => TOTAL / 4 ** level

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

/**
 * codepoint 順に並べたブロックの通し番号。
 * スペクトラム配色で「ブロック単位に色を配る」ために使う。
 */
const spectrumOrder = new Map(
  [...blocks]
    .sort((a, b) => a.ranges[0][0] - b.ranges[0][0])
    .map((block, i) => [block.id, i] as const)
)

export const blockCount = blocks.length

export const spectrumIndexOf = (blockId: string) =>
  spectrumOrder.get(blockId) ?? 0

export const toHex = (cp: number) =>
  `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
