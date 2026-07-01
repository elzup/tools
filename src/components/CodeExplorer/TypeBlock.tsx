import { Typography } from '@mui/material'
import styled from 'styled-components'
import { Box } from '../common/mui'
import type { Endian } from './constants'
import { ByteBlock } from './ByteBlock'
import { type Cmd, transCmd, uints } from './utils'

type Props = { cmd: Cmd; buf: Buffer; endian?: Endian }
export const TypeBlock = ({ cmd, buf, endian = 'LE' }: Props) => {
  const intNums = uints(buf)

  return (
    <Style>
      <Typography className="cmd">{cmd}</Typography>
      <Typography className="val">
        {String(transCmd(cmd, buf, endian))}
      </Typography>
      <Box display="flex" gap="2px" p={0.5}>
        {intNums.map((v, i) => (
          <ByteBlock key={i} c={v} />
        ))}
      </Box>
    </Style>
  )
}

const Style = styled.div`
  border: 1px solid #e0dcd6;
  border-radius: 8px;
  padding: 4px 6px;
  background: #fafafa;
  .asc {
    display: none;
  }
  .cmd {
    font-family: monospace;
    font-weight: 700;
    color: #795548;
  }
  .val {
    font-family: monospace;
    font-size: 0.95rem;
    color: #3e2723;
    word-break: break-all;
  }
`
