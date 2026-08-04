// 文字体系ごとの色家族。同じ体系のブロックは近い色相にまとめ、
// ブロック ID のハッシュで ±20° 揺らして隣接ブロックを見分けられるようにする。
export type Family = {
  id: string
  label: string
  hue: number
  match: (blockId: string) => boolean
}

const startsWithAny = (id: string, prefixes: string[]) =>
  prefixes.some((p) => id.startsWith(p))

const includesAny = (id: string, words: string[]) =>
  words.some((w) => id.includes(w))

const INDIC_IDS = [
  'devanagari',
  'bengali',
  'gurmukhi',
  'gujarati',
  'oriya',
  'tamil',
  'telugu',
  'kannada',
  'malayalam',
  'sinhala',
  'thai',
  'lao',
  'tibetan',
  'myanmar',
  'khmer',
  'khmer_symbols',
  'vedic_extensions',
  'buginese',
  'balinese',
  'sundanese',
  'batak',
  'tai_le',
  'new_tai_lue',
  'tai_tham',
  'limbu',
  'lepcha',
  'ol_chiki',
]

export const FAMILIES: Family[] = [
  {
    id: 'latin',
    label: 'ラテン文字系',
    hue: 210,
    match: (id) =>
      startsWithAny(id, [
        'basic_latin',
        'latin_',
        'ipa_',
        'phonetic_',
        'spacing_modifier',
        'combining_diacritical_marks',
        'superscripts_and_subscripts',
        'number_forms',
      ]),
  },
  {
    id: 'greek',
    label: 'ギリシャ文字',
    hue: 180,
    match: (id) => includesAny(id, ['greek', 'coptic']),
  },
  {
    id: 'cyrillic',
    label: 'キリル文字',
    hue: 270,
    match: (id) => id.startsWith('cyrillic') || id === 'glagolitic',
  },
  {
    id: 'cjk',
    label: 'CJK 文字系',
    hue: 0,
    match: (id) =>
      includesAny(id, [
        'cjk',
        'hiragana',
        'katakana',
        'bopomofo',
        'kanbun',
        'hangul',
        'kangxi',
        'ideographic',
        'cjk_strokes',
        'enclosed_cjk',
        'small_form_variants',
      ]),
  },
  {
    id: 'arabic',
    label: 'アラビア文字系',
    hue: 45,
    match: (id) =>
      id.startsWith('arabic') ||
      id.startsWith('syriac_') ||
      ['syriac', 'thaana', 'n_ko', 'samaritan', 'mandaic'].includes(id),
  },
  {
    id: 'hebrew',
    label: 'ヘブライ文字',
    hue: 60,
    match: (id) => id.includes('hebrew'),
  },
  {
    id: 'armenian',
    label: 'アルメニア文字',
    hue: 300,
    match: (id) => id === 'armenian',
  },
  {
    id: 'indic',
    label: 'インド系文字',
    hue: 140,
    match: (id) => INDIC_IDS.includes(id),
  },
  {
    id: 'georgian',
    label: 'グルジア文字',
    hue: 320,
    match: (id) => id.includes('georgian'),
  },
  {
    id: 'ethiopic',
    label: 'エチオピア文字',
    hue: 30,
    match: (id) => id.includes('ethiopic'),
  },
  {
    id: 'americas',
    label: 'アメリカ先住民文字',
    hue: 200,
    match: (id) =>
      includesAny(id, ['cherokee', 'canadian']) ||
      ['ogham', 'runic'].includes(id),
  },
  {
    id: 'philippine',
    label: 'フィリピン文字',
    hue: 160,
    match: (id) => ['tagalog', 'hanunoo', 'buhid', 'tagbanwa'].includes(id),
  },
  {
    id: 'mongolian',
    label: 'モンゴル文字',
    hue: 25,
    match: (id) => id === 'mongolian',
  },
  {
    id: 'symbols',
    label: '記号・装飾',
    hue: 260,
    match: (id) =>
      includesAny(id, [
        'symbols',
        'punctuation',
        'currency',
        'arrows',
        'mathematical',
        'technical',
        'optical',
        'enclosed',
        'box_drawing',
        'block_elements',
        'geometric',
        'dingbats',
        'braille',
        'letterlike',
        'control_pictures',
        'variation',
        'combining_half',
        'small_form',
        'yijing',
        'alchemical',
        'mahjong',
        'domino',
        'playing_cards',
      ]),
  },
]

const OTHER: Family = {
  id: 'other',
  label: 'その他・未分類',
  hue: 0,
  match: () => false,
}

export const familyOf = (blockId: string): Family =>
  FAMILIES.find((f) => f.match(blockId)) ?? OTHER

export const hashOf = (blockId: string) => {
  let hash = 0

  for (const c of blockId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return hash
}

// 色家族の基準色相から ±20° 揺らす
export const familyHueOf = (blockId: string, family: Family) =>
  (family.hue + (hashOf(blockId) % 40) - 20 + 360) % 360
