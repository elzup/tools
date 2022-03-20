import React from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'react-flow-renderer'
import styled from 'styled-components'
import { useFlowGraph } from './MermaidUi/useFlowGraph'

type Props = {
  mmd: string
  height?: string
  zoom?: number
  nodeSize?: { h: number; w: number }
  dire: 'LR' | 'TD'
}
function MmdGraph({
  mmd,
  height = '90vh',
  zoom = 0.5,
  nodeSize = { h: 100, w: 200 },
  dire = 'TD',
}: Props) {
  const { flows } = useFlowGraph(mmd, nodeSize, dire)

  if (flows.nodes.length === 0) return null

  return (
    <Frame style={{ height }}>
      <ReactFlowProvider>
        <ReactFlow
          id={mmd.split('')[1]}
          defaultNodes={flows.nodes}
          defaultEdges={flows.edges}
          minZoom={0.04}
          defaultZoom={zoom}
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
