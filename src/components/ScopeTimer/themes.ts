export type Theme = {
  LABEL: string
  BG_COLOR: string
  TEXT_COLOR: string
  BAR_COLOR: string
  SCALE_COLOR: string
  // 発光風の text-shadow。輪郭がぼけて撮影時の読み取りには不利なので、見た目重視のテーマだけ
  HAS_GLOW: boolean
}

export type ThemeKey =
  | 'blackOnWhite'
  | 'blackOnWhiteMono'
  | 'whiteOnBlack'
  | 'whiteOnBlackMono'
  | 'greenMatrix'
  | 'amberOnBlack'

export const THEMES: Record<ThemeKey, Theme> = {
  blackOnWhite: {
    LABEL: 'B/W Blue',
    BG_COLOR: '#fff',
    TEXT_COLOR: '#000',
    BAR_COLOR: '#4080ff',
    SCALE_COLOR: '#4080ff',
    HAS_GLOW: false,
  },
  blackOnWhiteMono: {
    LABEL: 'B/W Mono',
    BG_COLOR: '#fff',
    TEXT_COLOR: '#000',
    BAR_COLOR: '#000',
    SCALE_COLOR: '#000',
    HAS_GLOW: false,
  },
  whiteOnBlack: {
    LABEL: 'W/B Red',
    BG_COLOR: '#000',
    TEXT_COLOR: '#fff',
    BAR_COLOR: '#ff4040',
    SCALE_COLOR: '#ff4040',
    HAS_GLOW: false,
  },
  whiteOnBlackMono: {
    LABEL: 'W/B Mono',
    BG_COLOR: '#000',
    TEXT_COLOR: '#fff',
    BAR_COLOR: '#fff',
    SCALE_COLOR: '#fff',
    HAS_GLOW: false,
  },
  greenMatrix: {
    LABEL: 'Green',
    BG_COLOR: '#000',
    TEXT_COLOR: '#0f0',
    BAR_COLOR: '#0f0',
    SCALE_COLOR: '#0f0',
    HAS_GLOW: true,
  },
  amberOnBlack: {
    LABEL: 'Amber',
    BG_COLOR: '#000',
    TEXT_COLOR: '#ffb000',
    BAR_COLOR: '#ffb000',
    SCALE_COLOR: '#ffb000',
    HAS_GLOW: false,
  },
}

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[]
