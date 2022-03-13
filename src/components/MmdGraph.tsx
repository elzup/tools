import React from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer'
import styled from 'styled-components'
import { useFlowGraph } from './MermaidUi/useFlowGraph'

function MmdGraph({ mmd }: { mmd: string }) {
  const { flows } = useFlowGraph(mmd)

  return (
    <div>
      <Frame>
        <ReactFlow
          elements={flows}
          // onLoad={setRfInstance}
          panOnScroll={false}
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
      </Frame>
    </div>
  )
}
const Frame = styled.div`
  width: 100%;
  height: 500px;
  border: solid 1px #ccc;
`

export default MmdGraph
