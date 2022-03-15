import React from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'react-flow-renderer'
import styled from 'styled-components'
import { useFlowGraph } from './MermaidUi/useFlowGraph'

function MmdGraph({ mmd }: { mmd: string }) {
  const { flows } = useFlowGraph(mmd)

  if (flows.nodes.length === 0) return null

  return (
    <Frame>
      <ReactFlowProvider>
        <ReactFlow
          id={mmd.split('')[1]}
          nodes={flows.nodes}
          edges={flows.edges}
          minZoom={0.1}
          defaultZoom={0.5}
          // onLoad={setRfInstance}
          panOnScroll={false}
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </Frame>
  )
}
const Frame = styled.div`
  width: 100%;
  height: 500px;
  border: solid 1px #ccc;
`

export default MmdGraph
