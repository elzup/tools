import React, { useEffect, useState } from 'react'

const range = (v: number) => [...Array(v).keys()]
const width = 600

const draw = (
  x: number,
  y: number,
  k: number,
  ctx: CanvasRenderingContext2D
) => {
  ctx.fillStyle = `hsla(${k * 10}, 50%, 50%, 1.0)`
  ctx.fillRect(x, y, 1, 1)
}

function view(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ctx: CanvasRenderingContext2D,
  rep: number
) {
  if (!ctx) return
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, width)
  range(width).forEach((i) => {
    const a = (i * (x2 - x1)) / width + x1 // 定数Cの実部

    range(width).forEach((j) => {
      // y（虚部）方向のループ
      const b = (j * (y2 - y1)) / width + y1 // 定数Cの虚部
      const z = { x: 0, y: 0 }

      range(rep).some((k) => {
        ;[z.x, z.y] = [z.x * z.x - z.y * z.y + a, 2 * z.x * z.y + b]
        // z^2+Cの計算（実部）
        // z^2+Cの計算（虚部）
        if (z.x * z.x + z.y * z.y > 4) {
          // もし絶対値が2を（絶対値の2乗が4を）超えていたら
          draw(i, j, k, ctx)
          return true
        }
      })
    })
  })
}

export type Area = { sx: number; sy: number; ex: number; ey: number }
export const useMandelbulb = (zoom: Area, rep: number) => {
  const [png, setPng] = useState<string>('')

  useEffect(() => {
    const { sx, sy, ex, ey } = zoom
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = width
    canvas.height = width

    view(sx, sy, ex, ey, ctx, rep)
    ctx.moveTo(0, width / 2)
    ctx.lineTo(width, width / 2)
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, width)
    ctx.stroke()
    setPng(canvas.toDataURL())
  }, [zoom, rep])

  return [png]
}

export default () => <div>About us</div>
