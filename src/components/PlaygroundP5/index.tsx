import styled from 'styled-components'
import P5Wrapper from './P5Wrapper'
import { sketch1 } from './sketch1'
import { sketchPu } from './sketchPu'
import SixteenSegDisplay from './Seg16'
import { SegTitle } from './SegTitle'

const PlaygroundP5 = () => {
  return (
    <Style>
      <SegTitle />
      <SixteenSegDisplay char="1" />
      <SixteenSegDisplay char="D" />
      <SixteenSegDisplay char="A" />
      <P5Wrapper sketch={sketchPu} />
      <P5Wrapper sketch={sketch1} />
    </Style>
  )
}

const Style = styled.div``

export default PlaygroundP5
