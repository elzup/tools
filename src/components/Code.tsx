import React, { FC } from 'react'
import styled from 'styled-components'

type Props = {}
const Code: FC<Props> = ({ children }) => {
  return (
    <Style>
      <pre>{children}</pre>
    </Style>
  )
}

const Style = styled.code`
  pre {
    background: #ddd;
    font-size: 0.8rem;
    padding: 4px 8px;
  }
`

export default Code
