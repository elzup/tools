import { range } from '@elzup/kit'
import { TextField } from '@mui/material'
import React from 'react'
import { useLocalStorage } from '../../utils/useLocalStorage'

type Props = {}

const uints = (b: Buffer) => [
  ...range(b.byteLength).map((i) => {
    return b.readUint8(i)
  }),
]

const bitStr = (n: number) => n.toString(2).padStart(8, '0')

const ByteBlock = ({ c }: { c: number }) => {
  return (
    <div>
      <div>{c}</div>
      <div>{bitStr(c)}</div>
      <div>{c.toString(16).padStart(2, '0')}</div>
    </div>
  )
}

function CodeExplorer(props: Props) {
  const [text, setText] = useLocalStorage<string>('code-explorer-text', '')

  const buf = Buffer.from(text)
  const intNums = uints(buf)

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
        <div style={{ display: 'flex' }}>
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
    </div>
  )
}

export default CodeExplorer
