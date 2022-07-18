import { TextField, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import MmdGraph from '../MmdGraph'
import { useFetchText } from '../useFetch'
import { MmdGroup } from './types'
import { parseMarmaid } from './useMermaid'

type GraphBlock = {
  title: string
  mmd: MmdGroup
}

function useBlocks(text?: string): GraphBlock[] {
  return useMemo(() => {
    if (!text) return []

    const allLines = text.split('\n')
    const l = allLines.length

    const { blocks } = allLines.reduce(
      ({ blocks, lines, prevTitle }, line, i) => {
        const isLast = i === l - 1
        const title = line.match(/%%%subgraph (.*?);?$/)?.[1]

        if (isLast || !!title) {
          if (isLast) lines.push(line)
          const mmdText = lines.join('\n')

          return {
            blocks: [
              ...blocks,
              { title: prevTitle, mmd: parseMarmaid(mmdText) },
            ],
            lines: ['flowchart LR;'] as string[],
            prevTitle: title || '',
          }
        }
        return { blocks, lines: [...lines, line], prevTitle }
      },
      {
        blocks: [] as GraphBlock[],
        lines: [] as string[],
        prevTitle: '',
      }
    )

    return blocks
  }, [text])
}

function MermaidUi() {
  const [url, setUrl] = useState<string>(
    'https://raw.githubusercontent.com/elzup/story-plots/main/sample/min-flow.mmd'
  )
  const { data, error: _error } = useFetchText(url)
  const blocks = useBlocks(data)
  const _all = { title: 'all', mmd: data || '' }

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

export default MermaidUi
