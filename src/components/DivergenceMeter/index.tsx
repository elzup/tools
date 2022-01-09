import React from 'react'
import styled from 'styled-components'
import Nixie from './Nixie'

type Props = {
  chars: string
}
function DivergenceMeter({ chars }: Props) {
  return (
    <Wrap>
      {chars.split('').map((n, i) => (
        <Nixie key={`nk-${i}`} active={n} />
      ))}
    </Wrap>
  )
}

const Wrap = styled.div`
  background: black;
  display: grid;
  width: 100%;
  grid-auto-flow: column;
  padding: 8px;
`

export default DivergenceMeter
