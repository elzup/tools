import React from 'react'
import ReactFlow, { Background, Controls } from 'react-flow-renderer'
import { useEffectOnce } from 'react-use'
import { useFlowGraph } from './useFlowGraph'
import { useMermaid } from './useMermaid'

const mmd = `
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

const config = {
  startOnLoad: true,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'cardinal',
  },
  securityLevel: '',
}

function dartiyFuncForMmd() {
  // @ts-ignore
  window.helloCallback = () => {
    alert('hello event')
  }
}

function MurmaidUi() {
  const svg = useMermaid('emp', mmd, config)

  const { flows } = useFlowGraph(mmd)

  useEffectOnce(dartiyFuncForMmd)
  console.log(flows)

  return (
    <div>
      <div>{svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}</div>
      <div style={{ width: '100%', height: '500px' }}>
        <ReactFlow
          elements={flows}
          // onLoad={setRfInstance}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}
export default MurmaidUi
