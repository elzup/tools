import { type Family, familyHueOf, familyOf, hashOf } from './family'
import { blockCount, spectrumIndexOf } from './mapData'
import type { Block, Rarity, Rgb } from './types'

export type { Block, Rarity, Rgb } from './types'

export type ColorMode = 'family' | 'hash' | 'rarity' | 'spectrum'

export const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: 'family', label: '文字体系' },
  { id: 'hash', label: 'ブロックハッシュ' },
  { id: 'rarity', label: 'レア度' },
  { id: 'spectrum', label: 'スペクトラム' },
]

export const RARITY_COLORS: Record<Rarity, string> = {
  N: '#96b4dc',
  R: '#50c8a0',
  SR: '#b478dc',
  SSR: '#ffc83c',
}

const SPECIAL_COLORS = {
  control: '#e5e7eb',
  surrogate: '#d1d5db',
  pua: '#9ca3af',
  specials: '#6b7280',
} as const

export type Special = keyof typeof SPECIAL_COLORS

export const SPECIAL_LABELS: Record<Special, string> = {
  control: '制御文字',
  surrogate: 'サロゲート',
  pua: '私用領域 (PUA)',
  specials: 'Specials',
}

export const UNASSIGNED_COLOR = '#f3f4f6'

export const specialOf = (cp: number): Special | null => {
  if (cp <= 0x1f || cp === 0x7f) return 'control'
  if (cp >= 0x80 && cp <= 0x9f) return 'control'
  if (cp >= 0xd800 && cp <= 0xdfff) return 'surrogate'
  if (cp >= 0xe000 && cp <= 0xf8ff) return 'pua'
  if (cp >= 0xfff0 && cp <= 0xffff) return 'specials'
  return null
}

export const specialColorOf = (special: Special) => SPECIAL_COLORS[special]

/**
 * スペクトラム: codepoint 順のブロック通し番号で色相を一周させる。
 * codepoint ごとの連続グラデにするとブロックの塊が消えてしまうので、
 * 1 ブロック = 1 色に固定し、隣り合うブロックは明度を振って境界を出す。
 */
const spectrumRgb = (blockId: string): Rgb => {
  const order = spectrumIndexOf(blockId)

  return hslToRgb(
    (order / blockCount) * 360,
    0.8,
    order % 2 === 0 ? 0.68 : 0.48
  )
}

/** ブロック 1 つの代表色 */
export const blockRgbOf = (block: Block, mode: ColorMode): Rgb => {
  if (mode === 'rarity') {
    return hexToRgb(RARITY_COLORS[block.rarity] ?? RARITY_COLORS.N)
  }
  if (mode === 'spectrum') return spectrumRgb(block.id)
  if (mode === 'family') {
    return hslToRgb(familyHueOf(block.id, familyOf(block.id)))
  }
  return hslToRgb(hashOf(block.id) % 360)
}

export const cssRgb = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`

export const blockColorOf = (block: Block, mode: ColorMode) =>
  cssRgb(blockRgbOf(block, mode))

export const familyColorOf = (family: Family) => cssRgb(hslToRgb(family.hue))

/** '#rrggbb' -> [r, g, b] */
export const hexToRgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

/** hsl(H 75% 65%) 相当を RGB へ。ImageData 直書き用。 */
export const hslToRgb = (
  hue: number,
  saturation = 0.75,
  lightness = 0.65
): Rgb => {
  const a = saturation * Math.min(lightness, 1 - lightness)
  const f = (n: number) => {
    const k = (n + hue / 30) % 12

    return Math.round(
      (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255
    )
  }

  return [f(0), f(8), f(4)]
}
