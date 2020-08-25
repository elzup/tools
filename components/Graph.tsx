import { Stage, Graphics } from '@inlet/react-pixi'
import _ from 'lodash'
import * as React from 'react'
import { useWidth } from './useWdith'
import { Rectangle } from './PixiComponents'

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
const MARGIN = 0.3

type Props = {
  datasets: DataSet
}
export default function Graph({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWidth(ref)
  const {
    tops,
    btms,
    lines,
    m5s,
    h1s,
  }: {
    tops: PlotRect[]
    btms: PlotRect[]
    m5s: PlotRect[]
    h1s: PlotRect[]
    lines: LineProp[]
  } = React.useMemo(() => {
    console.log('memo')

    if (!size) return { tops: [], btms: [], m5s: [], h1s: [], lines: [] }
    const plotsm5 = datasets.m5.map(toPlot)
    const [top0, btm0] = plotsm5.reduce(maxmin, [
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ])
    const yd0 = top0 - btm0
    const top = top0 + yd0 * MARGIN
    const btm = btm0 - yd0 * MARGIN
    const yd = top - btm
    const toY = (v: number) => (1 - (v - btm) / yd) * size.height

    const lines: LineProp[] = []
    const m5s = plotsm5.map((p) => {
      const left = Date.now() - 39 * 60 * 60 * 1000
      const right = Date.now()
      const xd = right - left

      const xr = (+p.time - left) / xd
      const x = xr * size.width
      const y = toY(p.v)

      return { x, y }
    })

    m5s.reduce((p1, p2) => {
      if (!p1) return p2
      lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
      return p2
    }, m5s[0])

    const plots = datasets.h1.map(toPlot)

    const tops: PlotRect[] = []
    const btms: PlotRect[] = []
    const h1s: PlotRect[] = plots.map((p, i) => {
      const left = Date.now() - 39 * 60 * 60 * 1000
      const right = Date.now()
      const xd = right - left

      const w = size.width / 39
      const h = ((p.h - p.l) / yd) * size.height
      const xr = (+p.time - left) / xd
      const x = xr * size.width - w
      const y = toY(p.h)

      if (i >= 39) {
        const [max, min] = _.range(i, i - 39)
          .map((v) => plots[v])
          .reduce(maxmin, [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER])

        tops.push({ x, y: toY(max), w })
        btms.push({ x, y: toY(min), w })
      }

      return { x, y, w, h }
    })

    return { tops, btms, m5s, h1s, lines }
  }, [datasets.m5[datasets.m5.length - 1][0], size])

  if (window === undefined || !size)
    return <div style={{ width: '100%', height: '80vh' }} ref={ref}></div>

  return (
    <div style={{ width: '100%', height: '80vh' }} ref={ref}>
      <Stage width={size.width} height={size.height}>
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
        {btms.map((rect, i) => (
          <Rectangle
            key={`bt-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.w || 4}
            height={rect.h || 4}
            color={0xff0000}
          />
        ))}
        {tops.map((rect, i) => (
          <Rectangle
            key={`tp-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.w || 4}
            height={rect.h || 4}
            color={0x00ff00}
          />
        ))}
        {lines.map((line, i) => (
          // <Line key={`ln-${i}`} {...line} color={0xffffff} weight={2} />
          <Graphics
            key={`ln-${i}`}
            draw={(g) => {
              g.clear()
              g.lineStyle(2, 0xffffff)
                .moveTo(line.x1, line.y1)
                .lineTo(line.x2, line.y2)
            }}
          />
        ))}
      </Stage>
      <p>
        {datasets.allo.remaining / 1000000} / {4000}
      </p>
    </div>
  )
}
