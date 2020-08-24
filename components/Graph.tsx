import { PixiComponent, Stage } from '@inlet/react-pixi'
import { Graphics } from 'pixi.js'
import * as React from 'react'
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

export type Plot = { v: number; time: Date }
type Props = {
  plots: Plot[]
}
export default function Graph({ plots }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const size = useWindowSize(ref)
  const rects: number[][] = React.useMemo(() => {
    console.log('memo')

    if (!size) return [[]]
    const [top, bot] = plots.reduce(
      (p, c) => [Math.max(p[0], c.v), Math.min(p[1], c.v)],
      [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
    )
    const yd = top - bot

    return plots.map((p) => {
      const left = Date.now() - 39 * 60 * 60 * 1000
      const right = Date.now()
      const xd = right - left

      const xr = (+p.time - left) / xd
      const yr = (p.v - bot) / yd
      const x = xr * size.width
      const y = yr * size.height

      return [x, y]
    })
  }, [plots, size])

  if (window === undefined || !size)
    return <div style={{ width: '100%', height: '60vh' }} ref={ref}></div>

  console.log(rects)

  return (
    <div style={{ width: '100%', height: '60vh' }} ref={ref}>
      <Stage width={size.width - 100} height={size.height / 2}>
        {rects.map((rect, i) => (
          <Rectangle
            key={i}
            x={rect[0]}
            y={rect[1]}
            width={4}
            height={4}
            color={0xff0000}
          />
        ))}
      </Stage>
    </div>
  )
}
