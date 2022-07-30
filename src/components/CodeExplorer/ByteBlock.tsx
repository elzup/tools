import React from 'react'
import styled from 'styled-components'
import Code from './Code'

export const bitStr = (n: number) => n.toString(2).padStart(8, '0')

export const ByteBlock = ({ c }: { c: number }) => {
  return (
    <Style>
      <div className="hex">
        <Code text={c.toString(16).padStart(2, '0')} />
      </div>
      <div className="int">
        <Code text={c} />
      </div>
      <div className="bit">
        <Code text={bitStr(c)} />
      </div>
    </Style>
  )
}

const Style = styled.div`
  display: grid;
  grid-template-areas: 'hex int' 'bit bit';
  padding: 4px;
  border: 1px solid gray;
  margin: 2px;
  .int {
    grid-area: int;
    text-align: right;
  }

  .bit {
    grid-area: bit;
  }

  .hex {
    grid-area: hex;
  }
`
