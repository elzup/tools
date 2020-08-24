import { PixiComponent, Stage } from '@inlet/react-pixi'
import { Graphics } from 'pixi.js'
import * as React from 'react'

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
export default function Graph(props: Props) {
  if (window === undefined) return null
  return (
    <Stage>
      <Rectangle x={100} y={100} width={100} height={100} color={0xff0000} />
    </Stage>
  )
}
