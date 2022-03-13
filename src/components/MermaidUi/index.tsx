import { TextField } from '@mui/material'
import React, { useState } from 'react'
import ReactFlow, { Background, Controls } from 'react-flow-renderer'
import styled from 'styled-components'
import { useFetch } from './useFetch'
import { useFlowGraph } from './useFlowGraph'

const initMmd = `
flowchart LR
A-->B
A==>B
A---B
A-.-B
C-.-A
D-.-B
A-.-C
D-->|req|B
D-->|req|H[HH]
D-->|req|I(II)
D-->|req|J((JJ))
click A helloCallback "Tooltip"
click B "http://www.github.com" "This is a link"
click D href "http://www.github.com" "This is a link"
`

// const config = {
//   startOnLoad: true,
//   flowchart: {
//     useMaxWidth: true,
//     htmlLabels: true,
//     curve: 'cardinal',
//   },
//   securityLevel: 'loose',
// }

function Graph({ url }: { url: string }) {
  const { data, error } = useFetch(url)

  const mmd = (!error && data) || initMmd

  // const svg = useMermaid('emp', mmd, config)
  const { flows } = useFlowGraph(mmd)

  return (
    <div>
      {/* <div>{svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}</div> */}
      <Frame>
        <ReactFlow
          elements={flows}
          // onLoad={setRfInstance}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </Frame>
    </div>
  )
}

function MurmaidUi() {
  const [url, setUrl] = useState<string>('')

  return (
    <div>
      <TextField
        label="url"
        multiline
        onChange={(e) => setUrl(e.currentTarget.value)}
      />
      <Graph url={url} />
      <div className="mermaid"></div>
    </div>
  )
}

const Frame = styled.div`
  width: 100%;
  height: 500px;
  border: solid 1px #ccc;
`

export default MurmaidUi
