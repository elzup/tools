import React, { FC } from 'react'
import styled from 'styled-components'

type Props = {}
const Code: FC<Props> = ({ children }) => {
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
