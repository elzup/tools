import { TextField } from '@mui/material'
import React from 'react'
import { useLocalStorage } from '../../utils/useLocalStorage'

type Props = {}

function CodeExplorer(props: Props) {
  const [text, setText] = useLocalStorage<string>('code-explorer-text', '')

  const buf = Buffer.from(text)

  return (
    <div>
      <TextField
        value={text}
        multiline
        fullWidth
        style={{ fontSize: '0.8rem' }}
        onChange={(e) => setText(e.currentTarget.value)}
      />
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
    </div>
  )
}

export default CodeExplorer
