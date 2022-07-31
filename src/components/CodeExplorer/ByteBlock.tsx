import styled from 'styled-components'
import CodeLabel from './CodeLabel'
import { bitStr, readableAscii } from './utils'

type Props = {
  c: number
  variant?: 'plain' | 'utf8'
}

export const ByteBlock = ({ c, variant = 'plain' }: Props) => {
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
      <div
        className="bit"
        data-utf8cate={variant === 'utf8' ? bs.indexOf('0') : '-'}
      >
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

    &[data-utf8cate='0'] {
      > *:nth-child(-n + 1) {
        color: gray;
      }
    }
    &[data-utf8cate='1'] {
      > *:nth-child(-n + 2) {
        color: green;
      }
    }
    &[data-utf8cate='2'] {
      > *:nth-child(-n + 3) {
        color: pink;
      }
    }
    &[data-utf8cate='3'] {
      > *:nth-child(-n + 4) {
        color: blue;
      }
    }
    &[data-utf8cate='4'] {
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
