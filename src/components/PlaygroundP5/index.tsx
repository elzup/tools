import styled from 'styled-components'
import P5Wrapper from './P5Wrapper'
import { sketchRens } from './sketchRens'

const PlaygroundP5 = () => {
  return (
    <Style>
      <P5Wrapper sketch={sketchRens} />
    </Style>
  )
}

const Style = styled.div``

export default PlaygroundP5
