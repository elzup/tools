import { useState, useEffect } from 'react'
import _ from 'lodash'
import { DataSet, Candle } from './GraphSnake'

const CLOSE_MARGIN = 0.3

type PlotRect = { x: number; y: number; w?: number; h?: number }
const toPlot = (row: Candle): Plot => ({
  time: new Date(row[0][0] * 1000),
  h: row[0][2],
  l: row[0][3],
  v: row[0][4],
  vmax: row[1],
  vmin: row[2],
  w: row[3],
})
const maxmin = (p: [number, number], c: Plot): [number, number] => [
  Math.max(p[0], c.h),
  Math.min(p[1], c.l),
]
const MARGIN = 0.03
const HW = 60 * 60 * 1000

export type Plot = {
  v: number
  time: Date
  h: number
  l: number
  vmax: number
  vmin: number
  w: number
}
type Shapes = {
  m5s: PlotRect[]
  lines: LineProp[]
}
export type LineProp = {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: number
  weight?: number
}

const initShapes = { m5s: [], lines: [] }

export const useGraphSnake = (
  datasets: DataSet,
  size: { width: number; height: number } | null
) => {
  const [shapes, setShapes] = useState<Shapes>(initShapes)

  useEffect(() => {
    if (!size) return
    // const len = datasets.m5.length
    const len = 12 * 24
    const plotsm5 = datasets.m5.map(toPlot).slice(datasets.m5.length - len)
    const [top0, btm0] = plotsm5.reduce(maxmin, [
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ])
    const yd0 = top0 - btm0
    const top = top0 + yd0 * MARGIN
    const btm = btm0 - yd0 * MARGIN
    const yd = top - btm
    const toY = (v: number) => (1 - (v - btm) / yd) * size.height
    const right = Date.now()
    const left = right - len * 5 * 60 * 1000
    const xd = right - left
    const toX = (v: number) => ((v - left) / xd) * size.width

    const rulerY = _.range(btm, top, 10000)
      .map(toY)
      .map((y) => ({ x1: 0, x2: size.width, y1: y, y2: y, color: 0x330055 }))
    const rulerYB = _.range(btm, top, 50000)
      .map(toY)
      .map((y) => ({
        x1: 0,
        x2: size.width,
        y1: y,
        y2: y,
        weight: 2,
        color: 0x440066,
      }))
    const halfDayW = 12 * HW
    const xst = +plotsm5[0].time - (+plotsm5[0].time % halfDayW) - 9 * HW
    const xet = +plotsm5[plotsm5.length - 1].time
    const rulerXB = _.range(xst, xet, 12 * HW)
      .map(toX)
      .map((x) => ({
        x1: x,
        x2: x,
        y1: 0,
        y2: size.height,
        weight: 2,
        color: 0x440066,
      }))
    const rulerX = _.range(xst, xet, HW)
      .map(toX)
      .map((x) => ({ x1: x, x2: x, y1: 0, y2: size.height, color: 0x330055 }))

    const lines: LineProp[] = [...rulerXB, ...rulerYB, ...rulerX, ...rulerY]

    const m5s = plotsm5.map((p) => {
      const x = toX(+p.time)
      const y = toY(p.v)
      const vmax = toY(p.vmax)
      const vmin = toY(p.vmin)
      const d = vmax - vmin
      const md = d * CLOSE_MARGIN
      const mmax = vmax - md
      const mmin = vmin + md

      return { ...p, x, y, mmax, mmin, vmax, vmin }
    })

    m5s.reduce((p1, p2) => {
      if (!p1) return p2
      const xs = { x1: p1.x, x2: p2.x, weight: 1.5 }

      lines.push({ ...xs, y1: p1.vmax, y2: p2.vmax, color: 0x00ff00 })
      lines.push({ ...xs, y1: p1.vmin, y2: p2.vmin, color: 0xff0000 })
      lines.push({ ...xs, y1: p1.mmax, y2: p2.mmax, color: 0x76d275 })
      lines.push({ ...xs, y1: p1.mmin, y2: p2.mmin, color: 0xff6090 })

      lines.push({ ...xs, y1: p1.y, y2: p2.y })
      return p2
    }, m5s[0])

    setShapes({ m5s, lines })
  }, [datasets.m5[datasets.m5.length - 1][0], size])
  return shapes
}
