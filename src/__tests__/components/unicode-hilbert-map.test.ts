import { specialOf } from '../../components/UnicodeHilbertMap/colors'
import { familyOf } from '../../components/UnicodeHilbertMap/family'
import { d2xy } from '../../components/UnicodeHilbertMap/hilbert'
import {
  N,
  TOTAL,
  blocks,
  bmpBlocks,
  buildBlockIndex,
  smpBlocks,
  toHex,
} from '../../components/UnicodeHilbertMap/mapData'
import { buildPositions } from '../../components/UnicodeHilbertMap/positions'

describe('d2xy (ヒルベルト曲線)', () => {
  it('BMP 全体で座標が一意 (全単射)', () => {
    const seen = new Set<number>()

    for (let d = 0; d < TOTAL; d++) {
      const [x, y] = d2xy(N, d)

      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(N)
      seen.add(y * N + x)
    }
    expect(seen.size).toBe(TOTAL)
  })

  it('隣接する d の座標は必ず 1 マスだけ動く (曲線の連続性)', () => {
    let prev = d2xy(N, 0)

    for (let d = 1; d < TOTAL; d++) {
      const next = d2xy(N, d)
      const distance = Math.abs(next[0] - prev[0]) + Math.abs(next[1] - prev[1])

      expect(distance).toBe(1)
      prev = next
    }
  })
})

describe('buildPositions', () => {
  it.each(['hilbert', 'row'] as const)('%s の逆引きが往復する', (layout) => {
    const { xs, ys, cpAt } = buildPositions(layout)

    for (let cp = 0; cp < TOTAL; cp += 97) {
      expect(cpAt[ys[cp] * N + xs[cp]]).toBe(cp)
    }
  })

  it('行優先では codepoint が横に並ぶ', () => {
    const { xs, ys } = buildPositions('row')

    expect([xs[0], ys[0]]).toEqual([0, 0])
    expect([xs[1], ys[1]]).toEqual([1, 0])
    expect([xs[N], ys[N]]).toEqual([0, 1])
  })
})

describe('ブロックデータ', () => {
  it('BMP と SMP の両方を持つ', () => {
    expect(bmpBlocks.length).toBeGreaterThan(100)
    expect(smpBlocks.map((b) => b.id)).toEqual([
      'mahjong',
      'alchemical',
      'domino_h',
      'playing_cards_1',
    ])
  })

  it('buildBlockIndex が代表的な codepoint を正しいブロックに引く', () => {
    const index = buildBlockIndex()
    const idOf = (cp: number) => blocks[index[cp]].id

    expect(idOf(0x41)).toBe('basic_latin') // A
    expect(idOf(0x3042)).toBe('hiragana') // あ
    expect(idOf(0x30a2)).toBe('katakana') // ア
    expect(idOf(0x0870)).toBe('arabic_extended_b')
    expect(index[0x0378]).toBe(-1) // どのブロックにも属さない穴
  })

  it('SMP の codepoint は BMP の index に載らない', () => {
    const index = buildBlockIndex()

    expect(index.length).toBe(TOTAL)
  })
})

describe('specialOf', () => {
  it.each([
    [0x00, 'control'],
    [0x7f, 'control'],
    [0x85, 'control'],
    [0xd800, 'surrogate'],
    [0xe000, 'pua'],
    [0xfffe, 'specials'],
  ] as const)('U+%s は %s', (cp, expected) => {
    expect(specialOf(cp)).toBe(expected)
  })

  it('通常の文字は null', () => {
    expect(specialOf(0x41)).toBeNull()
    expect(specialOf(0x3042)).toBeNull()
  })
})

describe('familyOf', () => {
  it.each([
    ['basic_latin', 'latin'],
    ['hiragana', 'cjk'],
    ['cjk_unified_ideographs', 'cjk'],
    ['arabic', 'arabic'],
    ['hebrew', 'hebrew'],
    ['devanagari', 'indic'],
    ['mahjong', 'symbols'],
  ])('%s -> %s', (blockId, familyId) => {
    expect(familyOf(blockId).id).toBe(familyId)
  })
})

describe('toHex', () => {
  it('4 桁ゼロ埋めの U+ 表記になる', () => {
    expect(toHex(0x41)).toBe('U+0041')
    expect(toHex(0xffff)).toBe('U+FFFF')
  })
})
