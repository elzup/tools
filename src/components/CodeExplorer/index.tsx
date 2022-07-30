import { range } from '@elzup/kit'
import {
  Box,
  FormControl,
  FormLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { FaArrowsAltH } from 'react-icons/fa'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { ByteBlock } from './ByteBlock'
import CodeLabel from './Code'

const uints = (b: Buffer) => [
  ...range(b.byteLength).map((i) => {
    return b.readUint8(i)
  }),
]

const layoutState = ['col8', 'col4', 'fill'] as const

type LayoutState = typeof layoutState[number]
const isLayoutState = (v: unknown): v is LayoutState =>
  typeof v === 'string' && layoutState.includes(v as LayoutState)

function CodeExplorer() {
  const [text, setText] = useLocalStorage<string>('code-explorer-text', '')
  const [layout, setLayout] = useState<LayoutState>('col8')

  const buf = Buffer.from(text)
  const intNums = uints(buf)

  return (
    <Style>
      <TextField
        value={text}
        multiline
        fullWidth
        style={{ fontSize: '0.8rem' }}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      <FormControl>
        <FormLabel>layout</FormLabel>
        <ToggleButtonGroup
          value={layout}
          exclusive
          onChange={(_e, value) =>
            setLayout(isLayoutState(value) ? value : 'col8')
          }
          aria-label="blocks alignment"
        >
          <ToggleButton size="small" value="col8" aria-label="8 column">
            Col8
          </ToggleButton>
          <ToggleButton size="small" value="col4" aria-label="4 column">
            Col4
          </ToggleButton>
          <ToggleButton size="small" value="fill" aria-label="fill">
            <FaArrowsAltH />
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>
      <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
        <Typography variant="subtitle1">int</Typography>
        <Box className="bytes-line">
          {intNums.map((v, i) => (
            <CodeLabel key={i} text={v} variant="plain" />
          ))}
        </Box>
      </Box>
      <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
        <Typography variant="subtitle1">Byte View</Typography>
        <div className="blocks" data-layout={layout}>
          {intNums.map((v, i) => (
            <ByteBlock key={i} c={v} />
          ))}
        </div>
      </Box>
      <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
        <Typography variant="subtitle1">hex</Typography>
        <Box className="bytes-line">
          {intNums.map((v, i) => (
            <CodeLabel key={i} text={v.toString(16)} variant="plain" />
          ))}
        </Box>
      </Box>
      <div>
        <Typography variant="caption">{buf.length}Byte</Typography>
        <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
          <Typography variant="caption">ascii</Typography>
          <div>
            <CodeLabel text={buf.toString('ascii')} />
          </div>
        </Box>
        <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
          <Typography variant="caption">latin1 (binary)</Typography>
          <div>
            <CodeLabel text={buf.toString('latin1')} />
          </div>
        </Box>
      </div>
    </Style>
  )
}

const Style = styled.div`
  .blocks {
    display: grid;
    &[data-layout='col8'] {
      grid-template-columns: repeat(8, max-content);
    }
    &[data-layout='col4'] {
      grid-template-columns: repeat(4, max-content);
    }

    &[data-layout='fill'] {
      display: flex;
      flex-wrap: wrap;
    }
  }

  .bytes-line {
    span {
      margin: 2px;
    }
    span:nth-child(2n) {
      background: #f0f0f0;
    }
    span:nth-child(8n + 1):not(:first-child) {
      border-left: dashed 1px gray;
    }
  }
`

export default CodeExplorer
