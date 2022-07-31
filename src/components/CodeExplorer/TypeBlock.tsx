import { controlCharLib } from '@elzup/kit'
import React from 'react'
import styled from 'styled-components'
import CodeLabel from './CodeLabel'

export const bitStr = (n: number) => n.toString(2).padStart(8, '0')
export const readableAscii = (c: number) => {
  const controlChar = controlCharLib[c]

  if (controlChar) return `[${controlChar.char}]`
  return String.fromCharCode(c)
}

export const TypeBlock = ({ c }: { c: number }) => {
  const bs = bitStr(c)

  return (
    <Style>
      <div className="hex">
        <CodeLabel text={c.toString(16).padStart(2, '0')} />
      </div>
      <div className="dec">
        <CodeLabel text={c} />
      </div>
      <div className="asc">
        <CodeLabel text={readableAscii(c & 0x7f)} />
      </div>
      <div className="bit">
        <CodeLabel text={bs} />
      </div>
    </Style>
  )
}

const Style = styled.div`
  display: grid;
  grid-template-areas: 'asc ...' 'hex dec' 'bit bit';
  border: 1px solid gray;
  margin: 2px;
  .dec {
    grid-area: dec;
    text-align: right;
  }

  .asc {
    grid-area: asc;
    text-align: center;
  }

  .bit {
    grid-area: bit;
  }

  .hex {
    grid-area: hex;
    &::before {
      font-family: monospace;
      opacity: 0.5;
      content: '0x';
    }
  }
`
