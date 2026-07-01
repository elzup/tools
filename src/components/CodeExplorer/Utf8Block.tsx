import { Typography } from '@mui/material'
import styled from 'styled-components'
import { Box } from '../common/mui'
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
      <Typography className="char">{s}</Typography>
      <Box display="flex" gap="2px" p={0.5}>
        {intNums.map((v, i) => (
          <ByteBlock key={i} c={v} variant="utf8" />
        ))}
      </Box>
    </Style>
  )
}

const Style = styled.div`
  border: 1px solid #e0dcd6;
  border-radius: 8px;
  padding: 2px 4px;
  background: #fafafa;
  .asc {
    display: none;
  }
  .char {
    text-align: center;
    font-size: 1.1rem;
    color: #3e2723;
  }
`
