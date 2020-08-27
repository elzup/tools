import { Stage } from '@inlet/react-pixi'
import _ from 'lodash'
import * as React from 'react'
import { Line, Rectangle } from './PixiComponents'
import { useWidth } from './useWdith'

export type DataSet = {
  m5: number[][]
  h1: number[][]
  allo: { remaining: number }
}
export type Plot = { v: number; time: Date; h: number; l: number }
export type LineProp = {
  x1: number
  y1: number
  x2: number
  y2: number
}
type PlotRect = { x: number; y: number; w?: number; h?: number }
const toPlot = (row: number[]): Plot => ({
  time: new Date(row[0] * 1000),
  h: row[2],
  l: row[3],
  v: row[4],
})
const maxmin = (p: [number, number], c: Plot): [number, number] => [
  Math.max(p[0], c.h),
  Math.min(p[1], c.l),
]
const MARGIN = 0.04

type Props = {
  datasets: DataSet
}

const rectShapes = { tops: [], btms: [], m5s: [], h1s: [] }
const lineShapes = { lines: [], ruler: [], rulerB: [] }
const initShapes = { ...rectShapes, ...lineShapes }

type Shapes = {
  m5s: PlotRect[]
  h1s: PlotRect[]
  lines: LineProp[]
  ruler: LineProp[]
  rulerB: LineProp[]
  tops: LineProp[]
  btms: LineProp[]
}
const useGraph = (
  datasets: DataSet,
  size: { width: number; height: number } | null
) => {
  const [shapes, setShapes] = React.useState<Shapes>(initShapes)

  React.useEffect(() => {
    if (!size) return
    const tops: LineProp[] = []
    const btms: LineProp[] = []
    const lines: LineProp[] = []
    const plotsm5 = datasets.m5.map(toPlot)
    const plots = datasets.h1.map(toPlot)
    const [top0, btm0] = [...plotsm5, ...plots].reduce(maxmin, [
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ])
    const yd0 = top0 - btm0
    const top = top0 + yd0 * MARGIN
    const btm = btm0 - yd0 * MARGIN
    const yd = top - btm
    const toY = (v: number) => (1 - (v - btm) / yd) * size.height
    const right = Date.now()
    const left = right - 39 * 60 * 60 * 1000
    const xd = right - left
    const toX = (v: number) => ((v - left) / xd) * size.width

    const rulerY = _.range(btm, top, 10000)
      .map(toY)
      .map((y) => ({ x1: 0, x2: size.width, y1: y, y2: y }))
    const rulerYB = _.range(btm, top, 50000)
      .map(toY)
      .map((y) => ({ x1: 0, x2: size.width, y1: y, y2: y }))
    const xst = +plotsm5[0].time
    const xet = +plotsm5[plotsm5.length - 1].time
    const rulerXB = _.range(xst, xet, 5 * 60 * 60 * 1000)
      .map(toX)
      .map((x) => ({ x1: x, x2: x, y1: 0, y2: size.height }))
    const rulerX = _.range(xst, xet, 60 * 60 * 1000)
      .map(toX)
      .map((x) => ({ x1: x, x2: x, y1: 0, y2: size.height }))

    const ruler = [...rulerX, ...rulerY]
    const rulerB = [...rulerXB, ...rulerYB]

    const m5s = plotsm5.map((p) => {
      const x = toX(+p.time)
      const y = toY(p.v)

      return { x, y }
    })

    m5s.reduce((p1, p2) => {
      if (!p1) return p2
      lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
      return p2
    }, m5s[0])

    const h1s: PlotRect[] = plots.map((p, i) => {
      const isLast = i === plots.length - 1
      const w = (size.width / 39) * (isLast ? 2 : 1) // last length x2
      const h = ((p.h - p.l) / yd) * size.height
      const xr = (+p.time - left) / xd
      const x = xr * size.width - w * (isLast ? 1 / 2 : 1)
      const y = toY(p.h)

      if (i >= 39) {
        const [max, min] = _.range(i, i - 39)
          .map((v) => plots[v])
          .reduce(maxmin, [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER])
          .map(toY)

        tops.push({ x1: x, x2: x + w, y1: max, y2: max })
        btms.push({ x1: x, x2: x + w, y1: min, y2: min })
      }

      return { x, y, w, h }
    })

    setShapes({ tops, btms, m5s, h1s, lines, ruler, rulerB })
  }, [datasets.m5[datasets.m5.length - 1][0], size])
  return shapes
}

export default function Graph({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWidth(ref)
  const { tops, btms, h1s, lines, ...shapes } = useGraph(datasets, size)

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
        {shapes.ruler.map((l, i) => (
          <Line key={`ruler-${i}`} {...l} color={0x330055} />
        ))}
        {shapes.rulerB.map((l, i) => (
          <Line key={`rulerb-${i}`} {...l} color={0x440066} weight={2} />
        ))}
        {h1s.map((rect, i) => (
          <Rectangle
            key={`h1-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.w || 4}
            height={rect.h || 4}
            color={0x290053}
          />
        ))}
        {btms.map((l, i) => (
          <Line key={`bt-${i}`} {...l} color={0xff0000} />
        ))}
        {tops.map((l, i) => (
          <Line key={`tp-${i}`} {...l} color={0x00ff00} />
        ))}
        {lines.map((l, i) => (
          <Line key={`ln-${i}`} {...l} weight={1.5} />
        ))}
      </Stage>
      <p>
        {datasets.allo.remaining / 1000000} / {4000}
      </p>
    </div>
  )
}
