import {
  type Block,
  blockRgbOf,
  cssRgb,
  specialOf,
} from '../../components/UnicodeHilbertMap/colors'
import { familyOf } from '../../components/UnicodeHilbertMap/family'
import { d2xy } from '../../components/UnicodeHilbertMap/hilbert'
import {
  N,
  SIZE,
  TOTAL,
  blockCount,
  blocks,
  bmpBlocks,
  buildBlockIndex,
  smpBlocks,
  spectrumIndexOf,
  toHex,
} from '../../components/UnicodeHilbertMap/mapData'
import { buildPositions } from '../../components/UnicodeHilbertMap/positions'
import { buildWalls } from '../../components/UnicodeHilbertMap/walls'

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

describe('buildWalls (ヒルベルト曲線の壁)', () => {
  it('Lv.0 では壁がない', () => {
    expect(buildWalls(0)).toEqual([])
  })

  it('Lv.1 は中央から上に伸びる 1 本だけ', () => {
    const walls = buildWalls(1)
    const half = SIZE / 2

    expect(walls).toEqual([{ x1: half, y1: 0, x2: half, y2: half, depth: 1 }])
  })

  it('Lv.2 では各象限に 1 本ずつ壁が増える', () => {
    const walls = buildWalls(2)
    const quarter = SIZE / 4
    const depth2 = walls.filter((w) => w.depth === 2)

    // 4 象限それぞれの内部に 1 本 (中央から辺の中点へ伸びる長さ SIZE/4 の線)
    expect(depth2).toHaveLength(4)
    for (const wall of depth2) {
      const length = Math.abs(wall.x2 - wall.x1) + Math.abs(wall.y2 - wall.y1)

      expect(length).toBe(quarter)
    }
    // Lv.1 の中央十字のうち曲線が渡らない分は壁として残る
    expect(walls.filter((w) => w.depth === 1)).toHaveLength(5)
  })

  it('壁は曲線が通り抜ける境界を含まない', () => {
    const order = 4
    const cell = SIZE / order
    const walls = buildWalls(2)
    const isWall = (x1: number, y1: number, x2: number, y2: number) =>
      walls.some(
        (w) => w.x1 === x1 && w.y1 === y1 && w.x2 === x2 && w.y2 === y2
      )

    // d=0 (0,0) と d=1 (1,0) は連続して進むので境界に壁はない
    expect(isWall(cell, 0, cell, cell)).toBe(false)
    // d=1 (1,0) と (2,0) は曲線上で 1 と 14 なので壁になる
    expect(isWall(cell * 2, 0, cell * 2, cell)).toBe(true)
  })
})

describe('スペクトラム配色', () => {
  const spectrumOf = (blockId: string) =>
    cssRgb(
      blockRgbOf(blocks.find((b) => b.id === blockId) as Block, 'spectrum')
    )

  it('同じブロック内の codepoint はすべて同じ色になる', () => {
    const index = buildBlockIndex()
    const colorAt = (cp: number) =>
      cssRgb(blockRgbOf(blocks[index[cp]], 'spectrum'))

    // ひらがな 3 文字は同じ色
    expect(new Set([0x3042, 0x3060, 0x3093].map(colorAt)).size).toBe(1)
    // ブロックをまたぐと色が変わる (あ / ア)
    expect(colorAt(0x3042)).not.toBe(colorAt(0x30a2))
  })

  it('隣り合うブロックは別の色になる', () => {
    expect(spectrumOf('hiragana')).not.toBe(spectrumOf('katakana'))
    expect(spectrumOf('basic_latin')).not.toBe(spectrumOf('latin_1_supplement'))
  })

  it('codepoint 順に色相が一周する', () => {
    expect(spectrumIndexOf('basic_latin')).toBe(0)
    expect(spectrumIndexOf('hiragana')).toBeLessThan(
      spectrumIndexOf('katakana')
    )
    // 末尾は SMP の錬金術記号 (U+1F700)
    expect(spectrumIndexOf('alchemical')).toBe(blockCount - 1)
  })
})

describe('toHex', () => {
  it('4 桁ゼロ埋めの U+ 表記になる', () => {
    expect(toHex(0x41)).toBe('U+0041')
    expect(toHex(0xffff)).toBe('U+FFFF')
  })
})
