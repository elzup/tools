import { useState, useEffect } from 'react'
import _ from 'lodash'
import { DataSet, Candle } from './GraphSnake'

const CLOSE_MARGIN = 0.3
const ENTRY_MARGIN = 0.3
const GREEN = 0x00ff00
const GREEN_L = 0x76d275
const RED = 0xff0000
const RED_L = 0xff6090
const YELLOW = 0xffee58
const BLUE = 0x67daff
const PURPLE = 0x551177
const ORANGE = 0xffa000
const WHITE = 0xffffff
const GRAY = 0x444444

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
  // judge: boolean
}
type Shapes = {
  rects: PlotRect[]
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

const initShapes = { rects: [], lines: [] }

export const useGraphSnake = (
  datasets: DataSet,
  size: { width: number; height: number } | null
) => {
  const [shapes, setShapes] = useState<Shapes>(initShapes)

  useEffect(() => {
    if (!size) return
    // const len = datasets.m5.length
    const h = size.height * 2
    const w = size.width * 2
    const len = 12 * 12
    const plotsm5 = datasets.m5.map(toPlot).slice(datasets.m5.length - len)
    const [top0, btm0] = plotsm5.reduce(maxmin, [
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ])
    const yd0 = top0 - btm0
    const top = top0 + yd0 * MARGIN
    const btm = btm0 - yd0 * MARGIN
    const yd = top - btm
    const toY = (v: number) => (1 - (v - btm) / yd) * h
    const btmY = toY(btm0)
    const topY = toY(top0)
    const right = Date.now()
    const left = right - len * 5 * 60 * 1000
    const xd = right - left
    const toX = (v: number) => ((v - left) / xd) * w

    const rulerY = _.range(btm, top, 10000)
      .map(toY)
      .map((y) => ({ x1: 0, x2: w, y1: y, y2: y, weight: 2, color: PURPLE }))
    const rulerYB = _.range(btm, top, 50000)
      .map(toY)
      .map((y1) => ({ x1: 0, x2: w, y1, y2: y1, weight: 6, color: PURPLE }))
    const halfDayW = 12 * HW
    const xst = +plotsm5[0].time - (+plotsm5[0].time % halfDayW) - 9 * HW
    const xet = +plotsm5[plotsm5.length - 1].time
    const rulerXB = _.range(xst, xet, 12 * HW)
      .map(toX)
      .map((x1) => ({ x1, x2: x1, y1: 0, y2: h, weight: 6, color: PURPLE }))
    const rulerX = _.range(xst, xet, HW)
      .map(toX)
      .map((x1) => ({ x1, x2: x1, y1: 0, y2: h, color: PURPLE }))

    const lines: LineProp[] = [...rulerXB, ...rulerYB, ...rulerX, ...rulerY]
    const rects: PlotRect[] = []

    let position: 'no' | 'lo' | 'sh' = 'no'
    let prev = { x: 0, y: 0 }
    const snakeW = plotsm5[plotsm5.length - 1].w
    const snakeWfrom = plotsm5.length - snakeW

    const plots = plotsm5.map((p) => {
      const x = toX(+p.time)
      const y = toY(p.v)
      const vmax = toY(p.vmax)
      const vmin = toY(p.vmin)
      const d = p.vmax - p.vmin
      const mde = d * ENTRY_MARGIN
      const mdc = d * CLOSE_MARGIN
      const enMax = p.vmax - mde
      const enMin = p.vmin + mde
      const clMax = p.vmax - mdc
      const clMin = p.vmin + mdc
      const enLo = position === 'no' && p.h >= enMax
      const enSh = position === 'no' && p.l <= enMin
      const clLo = position === 'lo' && p.l <= clMin
      const clSh = position === 'sh' && p.h >= clMax

      if (enLo) {
        position = 'lo'
        prev.x = x
        prev.y = y
      } else if (enSh) {
        position = 'sh'
        prev.x = x
        prev.y = y
      } else if (clLo) {
        const ddy = Math.min(prev.y, y) - topY

        lines.push({
          x1: prev.x,
          x2: x,
          y1: prev.y - ddy,
          y2: y - ddy,
          color: BLUE,
        })
        position = 'no'
      } else if (clSh) {
        const ddy = btmY - Math.max(prev.y, y)

        lines.push({
          x1: prev.x,
          x2: x,
          y1: prev.y + ddy,
          y2: y + ddy,
          color: YELLOW,
        })
        position = 'no'
      }

      return {
        ...p,
        x,
        y,
        enMax: toY(enMax),
        enMin: toY(enMin),
        clMax: toY(clMax),
        clMin: toY(clMin),
        vmax,
        vmin,
        enLo,
        clLo,
        enSh,
        clSh,
      }
    })

    plots.reduce((p1, p2, i) => {
      if (!p1) return p2
      const xs = { x1: p1.x, x2: p2.x, weight: 2 }
      const xx = { x1: p2.x, x2: p2.x, weight: 2 }

      if (p2.enLo) lines.push({ ...xx, y1: 0, y2: p2.y, color: BLUE })
      if (p2.clLo) lines.push({ ...xx, y1: 0, y2: p2.y, color: BLUE })
      if (p2.enSh) lines.push({ ...xx, y1: p2.y, y2: h, color: YELLOW })
      if (p2.clSh) lines.push({ ...xx, y1: p2.y, y2: h, color: YELLOW })

      lines.push({ ...xs, y1: p1.vmax, y2: p2.vmax, color: GREEN })
      lines.push({ ...xs, y1: p1.vmin, y2: p2.vmin, color: RED })
      lines.push({ ...xs, y1: p1.enMax, y2: p2.enMax, color: GREEN_L })
      lines.push({ ...xs, y1: p1.enMin, y2: p2.enMin, color: RED_L })
      lines.push({ ...xs, y1: p1.clMax, y2: p2.clMax, color: GREEN_L })
      lines.push({ ...xs, y1: p1.clMin, y2: p2.clMin, color: RED_L })

      const color = i < snakeWfrom ? WHITE : ORANGE

      lines.push({ ...xs, y1: p1.y, y2: p2.y, color })
      lines.push({ ...xs, y1: toY(p1.l), y2: toY(p2.l), color: GRAY })
      lines.push({ ...xs, y1: toY(p1.h), y2: toY(p2.h), color: GRAY })
      if (i === plots.length - 1 && position !== 'no') {
        const base = { x1: prev.x, x2: p2.x, y1: prev.y }

        if (position === 'sh') {
          lines.push({ ...base, y2: p2.clMax, color: YELLOW })
        } else if (position === 'lo') {
          lines.push({ ...base, y2: p2.clMin, color: BLUE })
        }
      }

      return p2
    }, plots[0])

    setShapes({ rects, lines })
  }, [datasets.m5[datasets.m5.length - 1][0], size])
  return shapes
}
