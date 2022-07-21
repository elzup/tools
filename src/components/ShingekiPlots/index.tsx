import { groupByFunc, keyBy } from '@elzup/kit'
import { TextField, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { MmdEdge, MmdGroup, MmdVertex } from '../MermaidUi/types'
import { parseMarmaid } from '../MermaidUi/useMermaid'
import MmdGraph from '../MmdGraph'
import StoryMmdGraph from '../StoryMmdGraphSample'
import { useFetchText } from '../useFetch'

type GraphBlock = {
  title: string
  mmd: MmdGroup
}

function useBlocks(text?: string): GraphBlock[] {
  return useMemo(() => {
    if (text === undefined) return []

    const allLines = text.split('\n')
    const l = allLines.length
    const vertexes: MmdVertex[] = []

    const { blocks } = allLines.reduce(
      ({ blocks, lines, prevTitle }, line, i) => {
        const isLast = i === l - 1
        const title = line.match(/%%%subgraph (.*?);?$/)?.[1]

        if (isLast || title !== undefined) {
          if (isLast) lines.push(line)
          const mmdText = lines.join('\n')
          const mmd = parseMarmaid(mmdText)

          return {
            blocks: [...blocks, { title: prevTitle, mmd }],
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

    blocks.forEach(({ mmd: { vertices, edges } }) => {
      vertices.forEach((v) => {
        vertexes.push(v)
      })
      edges.forEach((e) => {
        edges.push(e)
      })
    })

    const vertexBy = keyBy(
      vertexes.filter((v) => !v.outside),
      (v) => v.id
    )

    // edges.forEach((e) => {
    //   if (!(e.start in edgeBy)) edgeByVertex[e.start] = []
    //   if (!(e.end in edgeBy)) edgeByVertex[e.end] = []
    // })

    type InsertQuery = { v: MmdVertex; e: MmdEdge; vid: string }
    const insertQueries: InsertQuery[] = []

    blocks.forEach(({ mmd: { vertices: vs, edges: es } }, bi) => {
      const vBy = keyBy(vs, (v) => v.id)

      es.forEach((e) => {
        if (vBy[e.start].outside)
          insertQueries.push({ vid: e.start, e, v: vBy[e.end] })
        if (vBy[e.end].outside)
          insertQueries.push({ vid: e.end, e, v: vBy[e.start] })
      })

      vs.forEach((v, j) => {
        if (v.outside && vertexBy[v.id] !== undefined)
          blocks[bi].mmd.vertices[j].text = vertexBy[v.id].text
      })
    })
    const queryByVid = groupByFunc(insertQueries, (q) => q.vid)

    blocks.forEach(({ mmd: { vertices: vs } }, bi) => {
      const blockVBy = keyBy(vs, (v) => v.id)

      vs.filter((v) => !v.outside).forEach((v) => {
        if (!queryByVid[v.id]) return
        queryByVid[v.id].forEach((q) => {
          if (!(q.v.id in blockVBy)) {
            blocks[bi].mmd.vertices.push({ ...q.v, outside: true })
            blockVBy[q.v.id] = q.v
          }
          blocks[bi].mmd.edges.push(q.e)
        })
      })
    })

    return blocks
  }, [text])
}
const isDev = process.env.NODE_ENV === 'development'

const plotUrl = isDev
  ? 'http://localhost:3001/ShingekiNoKyojin.mmd'
  : 'https://raw.githubusercontent.com/elzup/story-plots/main/ShingekiNoKyojin.mmd'

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
      <GraphStyle>
        <StoryMmdGraph />
        {blocks.map((block, i) => (
          <div key={`${i}_${block.title}`}>
            <Typography variant="h5">{block.title}</Typography>
            <MmdGraph
              mmd={block.mmd}
              height={`${Math.min(block.mmd.vertices.length * 5, 90)}vh`}
            />
          </div>
        ))}
      </GraphStyle>
    </div>
  )
}
const GraphStyle = styled.div`
  .react-flow {
    .react-flow__node {
      &.outside {
        border-style: dashed;
      }
    }

    .react-flow__edge {
      path {
        stroke-width: 2;
      }
    }
  }
`

export default Shingeki
