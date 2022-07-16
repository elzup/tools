import { TextField } from '@mui/material'
import React, { useMemo, useState } from 'react'
import StoryMmdGraph from '../StoryMmdGraphSample'
import { useFetchText } from '../useFetch'

type GraphBlock = {
  title: string
  mmd: string
}

function useBlocks(text?: string): GraphBlock[] {
  return useMemo(() => {
    if (text === undefined) return []

    const allLines = text.split('\n')
    const l = allLines.length

    const { blocks } = allLines.reduce(
      ({ blocks, lines, prevTitle }, line, i) => {
        const isLast = i === l - 1
        const title = line.match(/%%%subgraph (.*?);?$/)?.[1]

        if (isLast || title !== undefined) {
          if (isLast) lines.push(line)
          return {
            blocks: [...blocks, { title: prevTitle, mmd: lines.join('\n') }],
            lines: ['flowchart LR;'] as string[],
            prevTitle: title ?? '',
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
const plotUrl =
  // 'https://raw.githubusercontent.com/elzup/story-plots/main/ShingekiNoKyojin.mmd'
  'file:///Users/hiro/.ghq/github.com/elzup/story-plots/ShingekiNoKyojin.mmd'

function Shingeki() {
  const [url, setUrl] = useState<string>()
  const { data, error: _error } = useFetchText(plotUrl)
  const blocks = useBlocks(data)
  const _all = { title: 'all', mmd: data ?? '' }

  return (
    <div>
      <TextField
        style={{ display: 'none' }}
        label="url"
        multiline
        fullWidth
        defaultValue={url}
        onChange={(e) => {
          setUrl(e.currentTarget.value)
        }}
      />
      <StoryMmdGraph />
      {blocks.map((block, i) => (
        <div key={`${i}_${block.title}`}>
          {/* <Typography variant="h5">{block.title}</Typography>
          <MmdGraph mmd={block.mmd} /> */}
        </div>
      ))}
    </div>
  )
}

export default Shingeki
