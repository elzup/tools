import P5 from 'p5'
import styled from 'styled-components'
import { range } from '@elzup/kit/lib/range'
import P5Wrapper from './P5Wrapper'

export const sketch = (p: P5) => {
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

const PlaygroundP5 = () => {
  return (
    <Style>
      <P5Wrapper sketch={sketch} />
    </Style>
  )
}

const Style = styled.div``

export default PlaygroundP5
