import type { Point } from './geometry'

export const CANVAS_WIDTH = 560
export const CANVAS_HEIGHT = 560

type Preset = {
  nails: [number, number][]
  slack?: number
}

export const PRESETS = {
  equilateral: {
    nails: [
      [0.5, 0.15],
      [0.16, 0.79],
      [0.84, 0.79],
    ],
  },
  thin: {
    nails: [
      [0.5, 0.1],
      [0.4, 0.87],
      [0.6, 0.85],
    ],
  },
  obtuse: {
    nails: [
      [0.15, 0.7],
      [0.87, 0.8],
      [0.63, 0.28],
    ],
  },
  tight: {
    nails: [
      [0.5, 0.16],
      [0.18, 0.8],
      [0.82, 0.8],
    ],
    slack: 14,
  },
  line: {
    nails: [
      [0.13, 0.5],
      [0.5, 0.5],
      [0.86, 0.5],
    ],
    slack: 150,
  },
  point: {
    nails: [
      [0.485, 0.5],
      [0.515, 0.5],
      [0.5, 0.47],
    ],
    slack: 220,
  },
} satisfies Record<string, Preset>

export type PresetKey = keyof typeof PRESETS

export const PRESET_OPTIONS: { key: PresetKey; label: string }[] = [
  { key: 'equilateral', label: '正三角形' },
  { key: 'thin', label: '細長い' },
  { key: 'obtuse', label: '鈍角' },
  { key: 'tight', label: 'ほぼ三角形' },
  { key: 'line', label: '一直線＝楕円' },
  { key: 'point', label: '一点＝真円' },
]

export const presetToNails = (preset: Preset): Point[] =>
  preset.nails.map(([horizontalRatio, verticalRatio]) => ({
    x: horizontalRatio * CANVAS_WIDTH,
    y: verticalRatio * CANVAS_HEIGHT,
  }))
