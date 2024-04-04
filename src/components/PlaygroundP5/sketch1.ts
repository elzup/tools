import { range } from '@elzup/kit/lib/range'
import P5 from 'p5'

export const sketch1 = (p: P5) => {
  const size = 4
  const w = 105

  p.setup = () => {
    p.createCanvas(w * size, w * size)
    p.background('orange')
    p.noLoop()
    p.stroke('blue')
    p.fill('red')
  }

  p.draw = () => {
    p.strokeWeight(0)
    range(w ** 2).forEach((i) => {
      if (String(i) !== [...String(i)].reverse().join('')) {
        return
      }

      const x = (i % w) * size
      const y = Math.floor(i / w) * size

      p.rect(x, y, x + size, y + size)
    })
  }
}
