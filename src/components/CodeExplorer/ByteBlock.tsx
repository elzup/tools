import styled from 'styled-components'
import { utf8CateInfo, type Utf8Cate } from './constants'
import { useByteHover } from './HoverContext'
import { bitStr, readableAscii } from './utils'

type Props = {
  c: number
  variant?: 'plain' | 'utf8'
  // 指定すると全ビュー横断の hover 連動対象になる
  index?: number
}

export const ByteBlock = ({ c, variant = 'plain', index }: Props) => {
  const bs = bitStr(c)
  const cate = bs.indexOf('0') as Utf8Cate
  const { isHovered, bind } = useByteHover(index)

  return (
    <Style data-hovered={isHovered ? 'on' : 'off'} {...bind}>
      <div className="asc">{readableAscii(c & 0x7f)}</div>
      <div className="main">
        <span className="hex">{c.toString(16).padStart(2, '0')}</span>
        <span className="dec">{c}</span>
      </div>
      <div className="bit" data-utf8cate={variant === 'utf8' ? cate : '-'}>
        {[...bs].map((bit, i) => (
          <span key={i} className="b">
            {bit}
          </span>
        ))}
      </div>
    </Style>
  )
}

const cateColor = (cate: Utf8Cate) => utf8CateInfo[cate].color

const Style = styled.div`
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 2px;
  padding: 4px 5px 5px;
  border: 1px solid #e0dcd6;
  border-radius: 6px;
  background: #fff;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;

  &:hover,
  &[data-hovered='on'] {
    border-color: #d4a017;
    background: #fffbeb;
    box-shadow: 0 1px 4px rgba(180, 134, 11, 0.25);
  }

  .asc {
    text-align: center;
    font-size: 0.95rem;
    line-height: 1;
    color: #3e2723;
    min-height: 1rem;
  }

  .main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;

    .hex {
      font-size: 0.9rem;
      font-weight: 700;
      color: #5d4037;
      &::before {
        content: '0x';
        opacity: 0.4;
        font-weight: 400;
        font-size: 0.75em;
      }
    }
    .dec {
      font-size: 0.72rem;
      color: #9e9e9e;
    }
  }

  .bit {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    border-radius: 3px;
    overflow: hidden;

    .b {
      text-align: center;
      font-size: 0.6rem;
      line-height: 1.4;
      color: #616161;
    }
    /* 上位/下位ニブルを薄く塗り分け */
    .b:nth-child(-n + 4) {
      background: #f7f5f2;
    }
    .b:nth-child(n + 5) {
      background: #eeeae4;
    }

    /* UTF-8 リードビットを意味ベースで色付け */
    ${[0, 1, 2, 3, 4]
      .map(
        (n) => `
    &[data-utf8cate='${n}'] .b:nth-child(-n + ${n + 1}) {
      color: ${cateColor(n as Utf8Cate)};
      font-weight: 700;
    }`
      )
      .join('\n')}
  }
`
