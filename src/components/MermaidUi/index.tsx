import { TextField, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import MmdGraph from '../MmdGraph'
import { useFetch } from './useFetch'

type GraphBlock = {
  title: string
  mmd: string
}

function useBlocks(text?: string): GraphBlock[] {
  return useMemo(() => {
    if (!text) return []

    const allLines = text.split('\n')
    const l = allLines.length

    const { blocks } = allLines.reduce(
      ({ blocks, lines }, line, i) => {
        const isLast = i === l - 1
        const title = line.match(/%%%subgraph (.*?);?$/)?.[1]

        if (isLast || !!title) {
          if (isLast) lines.push(line)
          return {
            blocks: [...blocks, { title: title || '', mmd: lines.join('\n') }],
            lines: ['flowchart LR;'] as string[],
          }
        }
        return { blocks, lines: [...lines, line] }
      },
      {
        blocks: [] as GraphBlock[],
        lines: [] as string[],
      }
    )

    return blocks
  }, [text])
}

function MurmaidUi() {
  const [url, setUrl] = useState<string>(
    'https://raw.githubusercontent.com/elzup/story-plots/main/sample/min-flow.mmd'
  )
  const { data, error: _error } = useFetch(url)
  const blocks = useBlocks(data)

  return (
    <div>
      <TextField
        label="url"
        multiline
        fullWidth
        defaultValue={url}
        onChange={(e) => {
          setUrl(e.currentTarget.value)
        }}
      />
      {blocks.map((block, i) => (
        <div key={`${i}_${block.title}`}>
          <Typography variant="h5">{block.title}</Typography>
          <MmdGraph mmd={block.mmd} />
        </div>
      ))}
    </div>
  )
}

export default MurmaidUi
