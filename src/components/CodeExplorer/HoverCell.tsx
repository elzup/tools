import styled from 'styled-components'
import { useByteHover } from './HoverContext'

type Props = {
  index: number
  text: string | number
}

// hex / int 行の 1 バイトセル。Byte View と hover 連動する。
export const HoverCell = ({ index, text }: Props) => {
  const { isHovered, bind } = useByteHover(index)

  return (
    <Style data-hovered={isHovered ? 'on' : 'off'} {...bind}>
      {text}
    </Style>
  )
}

const Style = styled.span`
  white-space: pre;
  font-family: monospace;
  padding: 1px 3px;
  border-radius: 3px;
  transition: background 0.12s ease;

  &:nth-child(2n) {
    background: #f4f2ef;
  }
  &:nth-child(8n + 1):not(:first-child) {
    border-left: dashed 1px #c9c2b8;
  }
  &[data-hovered='on'] {
    background: #fde68a;
    box-shadow: 0 0 0 1px #d4a017;
  }
`
