/* eslint-disable new-cap */
import { PixiComponent } from '@inlet/react-pixi'
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
