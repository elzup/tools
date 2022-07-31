import { Box, Typography } from '@mui/material'
import styled from 'styled-components'
import { ByteBlock } from './ByteBlock'
import { Cmd, transCmd, uints } from './utils'

type Props = { cmd: Cmd; buf: Buffer }
export const TypeBlock = ({ cmd, buf }: Props) => {
  const intNums = uints(buf)

  return (
    <Style>
      <Typography>{cmd}</Typography>
      <Typography>{transCmd(cmd, buf)}</Typography>
      <Box display="flex" gap="1px" p={0.5}>
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
