import styled from 'styled-components'
import P5Wrapper from './P5Wrapper'
import { sketch1 } from './sketch1'
import { sketchPu } from './sketchPu'

const PlaygroundP5 = () => {
  return (
    <Style>
      <P5Wrapper sketch={sketchPu} />
      <P5Wrapper sketch={sketch1} />
    </Style>
  )
}

const Style = styled.div``

export default PlaygroundP5
