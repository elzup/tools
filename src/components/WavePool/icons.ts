// Font Awesome のアイコンを輪郭の点群にする。
// SVG パスを小さく塗りつぶし描画 → 縁のピクセルを拾う → spacing 以上離して間引く

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt,
  faDroplet,
  faHeart,
  faHouse,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import type { Vec } from './drive'
import type { IconKind } from './targets'

const ICONS: Record<IconKind, IconDefinition> = {
  heart: faHeart,
  star: faStar,
  bolt: faBolt,
  house: faHouse,
  droplet: faDroplet,
}

// アイコンの外接正方形の半辺 (プール半径 = 1)。対角でも PLACEABLE_RADIUS (0.85) に収まる
const ICON_HALF = 0.58
// 縁を拾う描画解像度。spacing (≈ 0.08) の 1/10 程度の細かさがあれば間引き後の位置ずれは見えない
const RASTER = 160
// アンチエイリアスの半透明を内側とみなす閾値 (alpha 0..255 の中間)
const ALPHA_INSIDE = 128

/** 内外マスク (RASTER×RASTER) から縁のピクセルを拾い、spacing 以上離れた点だけを残す */
export const outlineFromMask = (
  inside: (x: number, y: number) => boolean,
  size: number,
  half: number,
  spacing: number
): Vec[] => {
  const isEdge = (x: number, y: number) =>
    inside(x, y) &&
    (!inside(x - 1, y) ||
      !inside(x + 1, y) ||
      !inside(x, y - 1) ||
      !inside(x, y + 1))
  const toUnit = (x: number, y: number): Vec => ({
    x: ((x + 0.5) / size - 0.5) * 2 * half,
    y: ((y + 0.5) / size - 0.5) * 2 * half,
  })

  const edges = Array.from({ length: size * size }, (_, i) => ({
    x: i % size,
    y: Math.floor(i / size),
  }))
    .filter(({ x, y }) => isEdge(x, y))
    .map(({ x, y }) => toUnit(x, y))

  // 貪欲な間引き。走査順に依らず、残る点同士は必ず spacing 以上離れる
  return edges.reduce<Vec[]>(
    (kept, p) =>
      kept.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= spacing)
        ? [...kept, p]
        : kept,
    []
  )
}

const rasterize = (icon: IconDefinition) => {
  if (typeof document === 'undefined' || typeof Path2D === 'undefined')
    return null
  const canvas = document.createElement('canvas')
  canvas.width = RASTER
  canvas.height = RASTER
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const [width, height, , , path] = icon.icon
  const scale = RASTER / Math.max(width, height)
  ctx.translate((RASTER - width * scale) / 2, (RASTER - height * scale) / 2)
  ctx.scale(scale, scale)
  ctx.fill(new Path2D(Array.isArray(path) ? path.join(' ') : path))
  return ctx.getImageData(0, 0, RASTER, RASTER).data
}

/** アイコンの輪郭点 (プール座標)。canvas が使えない環境 (テスト等) では空配列 */
export const iconTargets = (kind: IconKind, spacing: number): Vec[] => {
  const alpha = rasterize(ICONS[kind])
  if (alpha === null) return []
  const inside = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < RASTER &&
    y < RASTER &&
    alpha[(y * RASTER + x) * 4 + 3] >= ALPHA_INSIDE
  return outlineFromMask(inside, RASTER, ICON_HALF, spacing)
}
