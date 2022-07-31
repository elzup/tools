import { controlCharLib } from '@elzup/kit'
import React from 'react'
import styled from 'styled-components'
import CodeLabel from './Code'

export const bitStr = (n: number) => n.toString(2).padStart(8, '0')
export const readableAscii = (c: number) => {
  const controlChar = controlCharLib[c]

  if (controlChar) return `[${controlChar.char}]`
  return String.fromCharCode(c)
}

export const ByteBlock = ({ c }: { c: number }) => {
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
      <div className="bit" data-cate={bs.indexOf('0')}>
        {[...bs].map((bit, i) => (
          <CodeLabel key={i} text={bit} />
        ))}
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

    > * {
      &:nth-child(-n + 5) {
        background: #ffffff;
      }
      &:nth-child(n + 5) {
        background: #e0e0e0;
      }
    }

    &[data-cate='0'] {
      > *:nth-child(-n + 1) {
        color: gray;
      }
    }
    &[data-cate='1'] {
      > *:nth-child(-n + 2) {
        color: green;
      }
    }
    &[data-cate='2'] {
      > *:nth-child(-n + 3) {
        color: pink;
      }
    }
    &[data-cate='3'] {
      > *:nth-child(-n + 4) {
        color: blue;
      }
    }
    &[data-cate='4'] {
      > *:nth-child(-n + 5) {
        color: orange;
      }
    }
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
