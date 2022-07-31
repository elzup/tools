import { Box, Typography } from '@mui/material'
import React from 'react'
import styled from 'styled-components'
import { ByteBlock } from './ByteBlock'
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
      <Box display="flex" gap="1px" p={0.5}>
        {intNums.map((v, i) => (
          <ByteBlock key={i} c={v} variant="utf8" />
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
