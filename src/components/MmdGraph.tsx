import React from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'react-flow-renderer'
import styled from 'styled-components'
import { useFlowGraph } from './MermaidUi/useFlowGraph'

function MmdGraph({ mmd, height = '90vh' }: { mmd: string; height?: string }) {
  const { flows } = useFlowGraph(mmd)

  if (flows.nodes.length === 0) return null

  return (
    <Frame style={{ height }}>
      <ReactFlowProvider>
        <ReactFlow
          id={mmd.split('')[1]}
          defaultNodes={flows.nodes}
          defaultEdges={flows.edges}
          minZoom={0.04}
          defaultZoom={0.5}
          // onLoad={setRfInstance}
          panOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Controls defaultChecked />
          <Background />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </Frame>
  )
}

const Frame = styled.div`
  width: 100%;
  border: solid 1px #ccc;
`

export default MmdGraph
