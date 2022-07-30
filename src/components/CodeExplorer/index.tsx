import { range } from '@elzup/kit'
import { Box, TextField } from '@mui/material'
import React, { useState } from 'react'
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

function CodeExplorer(props: Props) {
  const [text, setText] = useLocalStorage<string>('code-explorer-text', '')
  const [layout, setLayout] = useState<'col8' | 'col4' | 'fill'>('col8')

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
      <Box sx={{ display: 'flex' }}>
        {intNums.map((v, i) => (
          <code key={i}>{v}</code>
        ))}
      </Box>
      <div>
        <div className="blocks" data-layout={layout}>
          {intNums.map((v, i) => (
            <ByteBlock key={i} c={v} />
          ))}
        </div>
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
