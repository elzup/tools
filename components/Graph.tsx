import { PixiComponent, Stage } from '@inlet/react-pixi'
import { Graphics } from 'pixi.js'
import * as React from 'react'
import _ from 'lodash'
import { useWindowSize } from './useWdith'

type RectProps = {
  x: number
  y: number
  width: number
  height: number
  color?: number
}
// eslint-disable-next-line new-cap
const Rectangle = PixiComponent<RectProps, Graphics>('Rectangle', {
  create: () => new Graphics(),
  applyProps: (instance, _, props) => {
    const { x, y, width, height, color } = props

    instance.clear()
    instance.beginFill(color)
    instance.drawRect(x, y, width, height)
    instance.endFill()
  },
})

export type DataSet = {
  m5: number[][]
  h1: number[][]
  allo: { remaining: number }
}
export type Plot = { v: number; time: Date; h: number; l: number }
const toPlot = (row: number[]): Plot => ({
  time: new Date(row[0] * 1000),
  h: row[1],
  l: row[1],
  v: row[4],
})

type Props = {
  datasets: DataSet
}
export default function Graph({ datasets }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWindowSize(ref)
  const rects5m: number[][] = React.useMemo(() => {
    console.log('memo')

    if (!size) return [[]]
    const plotsm5 = datasets.m5.map(toPlot)
    const [top, bot] = plotsm5.reduce(
      (p, c) => [Math.max(p[0], c.v), Math.min(p[1], c.v)],
      [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
    )
    const yd = top - bot

    return plotsm5.map((p) => {
      const left = Date.now() - 39 * 60 * 60 * 1000
      const right = Date.now()
      const xd = right - left

      const xr = (+p.time - left) / xd
      const yr = 1 - (p.v - bot) / yd
      const x = xr * size.width
      const y = yr * size.height

      return [x, y]
    })
  }, [datasets.m5[datasets.m5.length - 1][0], size])
  const rects1h: {
    points: number[][]
    tops: number[][]
    btms: number[][]
  } = React.useMemo(() => {
    console.log('memo')

    if (!size) return { points: [], tops: [], btms: [] }
    const plots = datasets.h1.map(toPlot)
    const [top, bot] = plots.reduce(
      (p, c) => [Math.max(p[0], c.v), Math.min(p[1], c.v)],
      [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
    )
    const yd = top - bot
    const toY = (v: number) => (1 - (v - bot) / yd) * size.height

    const tops: number[][] = []
    const btms: number[][] = []
    const points = plots.map((p, i) => {
      const left = Date.now() - 39 * 60 * 60 * 1000
      const right = Date.now()
      const xd = right - left

      const xr = (+p.time - left) / xd
      const x = xr * size.width
      const y = toY(p.v)

      if (i >= 39) {
        const [min, max] = _.range(i, i - 39)
          .map((v) => plots[v])
          .reduce((p, c) => [Math.max(p[0], c.v), Math.min(p[1], c.v)], [
            Number.MIN_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER,
          ])

        tops.push([x, toY(max)])
        btms.push([x, toY(min)])
      }

      return [x, y]
    })

    return { points, tops, btms }
  }, [datasets.h1[datasets.h1.length - 1][0], size])

  if (window === undefined || !size)
    return <div style={{ width: '100%', height: '20vh' }} ref={ref}></div>

  console.log(rects5m)

  return (
    <div style={{ width: '100%', height: '20vh' }} ref={ref}>
      <Stage width={size.width} height={size.height}>
        {rects5m.map((rect, i) => (
          <Rectangle
            key={i}
            x={rect[0]}
            y={rect[1]}
            width={4}
            height={4}
            color={0xffffff}
          />
        ))}
      </Stage>
      <Stage width={size.width} height={size.height}>
        {rects1h.points.map((rect, i) => (
          <Rectangle
            key={i}
            x={rect[0]}
            y={rect[1]}
            width={4}
            height={4}
            color={0xffffff}
          />
        ))}
        {rects1h.btms.map((rect, i) => (
          <Rectangle
            key={i}
            x={rect[0]}
            y={rect[1]}
            width={4}
            height={4}
            color={0xff0000}
          />
        ))}
        {rects1h.tops.map((rect, i) => (
          <Rectangle
            key={i}
            x={rect[0]}
            y={rect[1]}
            width={4}
            height={4}
            color={0x00ff00}
          />
        ))}
      </Stage>
      <p>
        {datasets.allo.remaining / 1000000} / {4000}
      </p>
    </div>
  )
}
