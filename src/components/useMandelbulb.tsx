import { useEffect, useState } from 'react'

const range = (v: number) => [...Array(v).keys()]

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
  rep: number,
  size: number
) {
  if (!ctx) return
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, size, size)
  range(size).forEach((i) => {
    const a = (i * (x2 - x1)) / size + x1 // 定数Cの実部

    range(size).forEach((j) => {
      // y（虚部）方向のループ
      const b = (j * (y2 - y1)) / size + y1 // 定数Cの虚部
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
export const useMandelbulb = (zoom: Area, rep: number, size: number) => {
  const [png, setPng] = useState<string>('')

  useEffect(() => {
    const { sx, sy, ex, ey } = zoom
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = size
    canvas.height = size

    view(sx, sy, ex, ey, ctx, rep, size)
    ctx.moveTo(0, size / 2)
    ctx.lineTo(size, size / 2)
    ctx.moveTo(size / 2, 0)
    ctx.lineTo(size / 2, size)
    ctx.stroke()
    setPng(canvas.toDataURL())
  }, [zoom, rep, size])

  return [png]
}
