/* eslint-disable new-cap */
import { PixiComponent, Graphics as GraphicsC } from '@inlet/react-pixi'
import { Graphics } from 'pixi.js'

type RectProps = {
  x: number
  y: number
  width: number
  height: number
  color: number
}
export const Rectangle = PixiComponent<RectProps, Graphics>('Rectangle', {
  create: () => new Graphics(),
  applyProps: (instance, op, props) => {
    const { x, y, width, height, color } = props

    instance.clear()
    instance.beginFill(color)
    instance.drawRect(x, y, width, height)
    instance.endFill()
  },
})

type LineProps = {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: number
  weight?: number
}
export const Line = ({ x1, y1, x2, y2, color, weight }: LineProps) => (
  <GraphicsC
    draw={(g) => {
      g.clear()
      g.lineStyle(weight, color).moveTo(x1, y1).lineTo(x2, y2)
    }}
  />
)
Line.defaultProps = {
  color: 0xffffff,
  weight: 1,
}
