import { Box, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { bitStr, ByteBlock } from './ByteBlock'
import { uints } from './utils'

type Props = {
  s: string
}

export const Utf8Block = ({ s }: Props) => {
  const buf = Buffer.from(s)
  const intNums = uints(buf)

  return (
    <Style>
      <Typography>{s}</Typography>
      <Box display="flex">
        {intNums.map((v, i) => (
          <ByteBlock key={i} c={v} />
        ))}
      </Box>
    </Style>
  )
}

const Style = styled.div`
  border: 1px solid gray;
  .asc {
    display: none;
  }
`
