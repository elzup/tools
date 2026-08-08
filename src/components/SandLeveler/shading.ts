// 砂表面の陰影計算 (2D Canvas / 3D 頂点カラー共用)
import { GRID, type SandField } from './field'

const SAND_R = 216
const SAND_G = 197
const SAND_B = 158
const LIGHT = { x: -0.45, y: -0.55, z: 0.7 }
const GRAD_SCALE = 5

const lightLen = Math.hypot(LIGHT.x, LIGHT.y, LIGHT.z)
const LX = LIGHT.x / lightLen
const LY = LIGHT.y / lightLen
const LZ = LIGHT.z / lightLen

/** 皿内セル (x, y) の表示色を out[0..2] (0-255) に書き込む */
export const shadeCell = (
  field: SandField,
  x: number,
  y: number,
  out: number[]
) => {
  const { height, inside } = field
  const idx = y * GRID + x
  const left = x > 0 && inside[idx - 1] ? height[idx - 1] : height[idx]
  const right = x < GRID - 1 && inside[idx + 1] ? height[idx + 1] : height[idx]
  const up = y > 0 && inside[idx - GRID] ? height[idx - GRID] : height[idx]
  const down =
    y < GRID - 1 && inside[idx + GRID] ? height[idx + GRID] : height[idx]
  const gx = (right - left) * GRAD_SCALE
  const gy = (down - up) * GRAD_SCALE
  const invLen = 1 / Math.sqrt(gx * gx + gy * gy + 1)
  const dot = (-gx * LX - gy * LY + LZ) * invLen
  const shade = 0.45 + 0.55 * Math.max(0, dot)
  const lift = height[idx] * 10

  out[0] = Math.max(0, Math.min(255, SAND_R * shade + lift))
  out[1] = Math.max(0, Math.min(255, SAND_G * shade + lift))
  out[2] = Math.max(0, Math.min(255, SAND_B * shade + lift))
}
