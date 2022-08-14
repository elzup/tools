import styled from 'styled-components'
import { WithChild } from '../types'

type Props = {}
const Code = ({ children }: WithChild<Props>) => {
  return (
    <Style>
      <code>{children}</code>
    </Style>
  )
}

const Style = styled.pre`
  background: #ddd;
  font-size: 0.8rem;
  padding: 4px 8px;
`

export default Code
