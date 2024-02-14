import P5 from 'p5'
import styled from 'styled-components'
import P5Wrapper from './P5Wrapper'

export const sketch = (p: P5) => {
  p.setup = () => {
    p.createCanvas(400, 400)
    p.background(100)
  }

  p.draw = () => {
    p.ellipse(p.width / 2, p.height / 2, 50, 50)
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
