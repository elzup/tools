import { range } from '@elzup/kit'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { FaArrowsAltH } from 'react-icons/fa'
import styled from 'styled-components'
import { useLocalStorage } from '../../utils/useLocalStorage'
import Code from '../Code'
import { ByteBlock } from './ByteBlock'

type Props = {}

const uints = (b: Buffer) => [
  ...range(b.byteLength).map((i) => {
    return b.readUint8(i)
  }),
]

const layoutState = ['col8', 'col4', 'fill'] as const

type LayoutState = typeof layoutState[number]
const isLayoutState = (v: string): v is LayoutState => layoutState.includes(v)

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
      <Box sx={{ display: 'flex' }}>
        {intNums.map((v, i) => (
          <code key={i}>{v}</code>
        ))}
      </Box>
      <Box border="solid 1px" mt={1} p={1} borderRadius={1}>
        <Typography variant="h6">Byte View</Typography>
        <div className="blocks" data-layout={layout}>
          {intNums.map((v, i) => (
            <ByteBlock key={i} c={v} />
          ))}
        </div>
      </Box>
      <div>
        <pre>
          <code>{buf.length}</code>
        </pre>
        <pre>
          <code>ascii: {buf.toString('ascii')}</code>
        </pre>
        <pre>
          <code>hex: {buf.toString('hex')}</code>
        </pre>
        <pre>
          <code>bin: {buf.toString('binary')}</code>
        </pre>
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
`

export default CodeExplorer
