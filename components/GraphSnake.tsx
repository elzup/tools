import { Stage } from '@inlet/react-pixi'
import _ from 'lodash'
import * as React from 'react'
import { Line, Rectangle } from './PixiComponents'
import { useWidth } from './useWdith'

const CLOSE_MARGIN = 0.3

type Candle = [[number, number, number, number, number], number, number, number]
export type DataSet = {
  m5: Candle[]
  allo: { remaining: number }
}
export type Plot = {
  v: number
  time: Date
  h: number
  l: number
  vmax: number
  vmin: number
  w: number
}
export type LineProp = {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: number
  weight?: number
}
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

type Props = {
  datasets: DataSet
}

const rectShapes = { tops: [], btms: [], m5s: [] }
const lineShapes = { lines: [], ruler: [], rulerB: [] }
const initShapes = { ...rectShapes, ...lineShapes }

type Shapes = {
  m5s: PlotRect[]
  lines: LineProp[]
}
const useGraph = (
  datasets: DataSet,
  size: { width: number; height: number } | null
) => {
  const [shapes, setShapes] = React.useState<Shapes>(initShapes)

  React.useEffect(() => {
    if (!size) return
    const len = datasets.m5.length
    const plotsm5 = datasets.m5.map(toPlot)
    const [top0, btm0] = plotsm5.reduce(maxmin, [
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ])
    const yd0 = top0 - btm0
    const top = top0 + yd0 * MARGIN
    const btm = btm0 - yd0 * MARGIN
    const yd = top - btm
    const ymd = yd * CLOSE_MARGIN
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
    const xst = +plotsm5[0].time
    const xet = +plotsm5[plotsm5.length - 1].time
    const rulerXB = _.range(xst, xet, 5 * 60 * 60 * 1000)
      .map(toX)
      .map((x) => ({
        x1: x,
        x2: x,
        y1: 0,
        y2: size.height,
        weight: 2,
        color: 0x440066,
      }))
    const rulerX = _.range(xst, xet, 60 * 60 * 1000)
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

      lines.push({ ...xs, y1: p1.y, y2: p2.y })

      lines.push({ ...xs, y1: p1.vmax, y2: p2.vmax, color: 0x00ff00 })
      lines.push({ ...xs, y1: p1.vmin, y2: p2.vmin, color: 0xff0000 })
      lines.push({ ...xs, y1: p1.mmax, y2: p2.mmax, color: 0x76d275 })
      lines.push({ ...xs, y1: p1.mmin, y2: p2.mmin, color: 0xff6090 })
      return p2
    }, m5s[0])

    // const h1s: PlotRect[] = plots.map((p, i) => {
    //   const isLast = i === plots.length - 1
    //   const w = (size.width / CB_SIZE_H) * (isLast ? 2 : 1) // last length x2
    //   const h = ((p.h - p.l) / yd) * size.height
    //   const xr = (+p.time - left) / xd
    //   const x = xr * size.width - w * (isLast ? 1 / 2 : 1)
    //   const y = toY(p.h)

    //   if (i >= CB_SIZE_H) {
    //     const [max, min] = _.range(i, i - CB_SIZE_H)
    //       .map((v) => plots[v])
    //       .reduce(maxmin, [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER])
    //       .map(toY)

    //     //
    //     const d = max - min
    //     const md = d * CLOSE_MARGIN
    //     const mmax = max - md
    //     const mmin = min + md

    //     lines.push({ x1: x, x2: x + w, y1: max, y2: max, color: 0x00ff00 })
    //     lines.push({ x1: x, x2: x + w, y1: min, y2: min, color: 0xff0000 })
    //     lines.push({ x1: x, x2: x + w, y1: mmax, y2: mmax, color: 0x76d275 })
    //     lines.push({ x1: x, x2: x + w, y1: mmin, y2: mmin, color: 0xff6090 })
    //   }

    //   return { x, y, w, h }
    // })

    setShapes({ m5s, lines })
  }, [datasets.m5[datasets.m5.length - 1][0], size])
  return shapes
}

export default function GraphSnake({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWidth(ref)
  const { lines } = useGraph(datasets, size)

  console.log(size)

  if (!size)
    return (
      <div style={{ width: '100vw', height: '80vh' }} ref={ref}>
        loading
      </div>
    )

  return (
    <div style={{ width: '100vw', height: '80vh' }} ref={ref}>
      <Stage
        width={size.width}
        height={size.height}
        options={{ resolution: 1 }}
      >
        {/* {h1s.map((rect, i) => (
          <Rectangle
            key={`h1-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.w || 4}
            height={rect.h || 4}
            color={0x290053}
          />
        ))} */}
        {lines.map((l, i) => (
          <Line key={`ln-${i}`} {...l} />
        ))}
      </Stage>
      <p>
        {datasets.allo.remaining / 1000000} / {4000}
      </p>
    </div>
  )
}
